// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as _ from 'lodash';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import * as React from 'react';

import { AssessmentToggleActionPayload } from '../background/actions/action-payloads';
import { createInitialAssessmentTestData } from '../background/create-initial-assessment-test-data';
import { InstanceIdentifierGenerator, UniquelyIdentifiableInstances } from '../background/instance-identifier-generator';
import { RequirementComparer } from '../common/assessment/requirement-comparer';
import { AssesssmentVisualizationConfiguration } from '../common/configs/assesssment-visualization-configuration';
import { Messages } from '../common/messages';
import { ManualTestStatus } from '../common/types/manual-test-status';
import { FeatureFlagStoreData } from '../common/types/store-data/feature-flag-store-data';
import { AssessmentScanData, ScanData } from '../common/types/store-data/visualization-store-data';
import { AssessmentInstanceRowData, AssessmentInstanceTable } from '../DetailsView/components/assessment-instance-table';
import { AssessmentTestView } from '../DetailsView/components/assessment-test-view';
import { RequirementLink } from '../DetailsView/components/requirement-link';
import { AnalyzerProvider } from '../injected/analyzers/analyzer-provider';
import { DecoratedAxeNodeResult, ScannerUtils } from '../injected/scanner-utils';
import {
    PropertyBags,
    VisualizationInstanceProcessor,
    VisualizationInstanceProcessorCallback,
} from '../injected/visualization-instance-processor';
import { DrawerProvider } from '../injected/visualization/drawer-provider';
import { DictionaryStringTo } from '../types/common-types';
import { Assessment, AssistedAssessment, ManualAssessment } from './types/iassessment';
import { ReportInstanceField } from './types/report-instance-field';
import { Requirement } from './types/requirement';

export class AssessmentBuilder {
    private static applyDefaultReportFieldMap(requirement: Requirement): void {
        const { comment, snippet, path } = ReportInstanceField.common;

        const defaults = requirement.isManual ? [comment] : [path, snippet];
        const specified = requirement.reportInstanceFields || [];

        requirement.reportInstanceFields = [...defaults, ...specified];
    }

    private static applyDefaultFunctions(requirement: Requirement): void {
        if (!requirement.getInstanceStatus) {
            requirement.getInstanceStatus = AssessmentBuilder.getInstanceStatus;
        }

        if (!requirement.getInstanceStatusColumns) {
            requirement.getInstanceStatusColumns = AssessmentBuilder.getInstanceStatusColumns;
        }

        if (!requirement.renderInstanceTableHeader) {
            requirement.renderInstanceTableHeader = AssessmentBuilder.renderInstanceTableHeader;
        }

        if (!requirement.renderRequirementDescription) {
            requirement.renderRequirementDescription = AssessmentBuilder.renderRequirementDescription;
        }

        if (!requirement.getDefaultMessage) {
            requirement.getDefaultMessage = defaultMessageGenerator => defaultMessageGenerator.getNoMatchingInstanceMessage;
        }
    }

    private static getInstanceStatus(result: DecoratedAxeNodeResult): ManualTestStatus {
        return ManualTestStatus.UNKNOWN;
    }

    private static getInstanceStatusColumns(): Readonly<IColumn>[] {
        return [
            {
                key: 'statusChoiceGroup',
                name: 'Pass / Fail',
                ariaLabel: 'Pass',
                fieldName: 'statusChoiceGroup',
                minWidth: 100,
                maxWidth: 100,
                isResizable: false,
            },
        ];
    }

    private static renderInstanceTableHeader(table: AssessmentInstanceTable, items: AssessmentInstanceRowData[]): JSX.Element {
        return table.renderDefaultInstanceTableHeader(items);
    }

    private static renderRequirementDescription(requirementLink: RequirementLink): JSX.Element {
        return requirementLink.renderRequirementDescriptionWithIndex();
    }

    private static enableTest(scanData: ScanData, payload: AssessmentToggleActionPayload): void {
        const scanAssessmentData = scanData as AssessmentScanData;
        scanAssessmentData.enabled = true;
        scanAssessmentData.stepStatus[payload.requirement] = true;
    }

    private static disableTest(scanData: ScanData, requirement: string): void {
        const scanAssessmentData = scanData as AssessmentScanData;
        scanAssessmentData.stepStatus[requirement] = false;
        scanAssessmentData.enabled = Object.keys(scanAssessmentData.stepStatus).some(key => scanAssessmentData.stepStatus[key] === true);
    }

    private static getTestStatus(scanData: ScanData, requirement: string): boolean {
        const scanAssessmentData = scanData as AssessmentScanData;
        return requirement in scanAssessmentData.stepStatus && scanAssessmentData.stepStatus[requirement];
    }

    public static Manual(assessment: ManualAssessment): Assessment {
        const { key, requirements } = assessment;

        assessment.requirementOrder = assessment.requirementOrder || RequirementComparer.byOrdinal;
        assessment.executeAssessmentScanPolicy = assessment.executeAssessmentScanPolicy || AssessmentBuilder.nullScanPolicy;
        assessment.initialDataCreator = assessment.initialDataCreator || createInitialAssessmentTestData;

        requirements.forEach(AssessmentBuilder.applyDefaultReportFieldMap);
        requirements.forEach(AssessmentBuilder.applyDefaultFunctions);

        const getAnalyzer = (provider: AnalyzerProvider, requirement: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            return provider.createBaseAnalyzer({
                key: requirementConfig.key,
                testType: assessment.visualizationType,
                analyzerMessageType: Messages.Assessment.AssessmentScanCompleted,
            });
        };

        const getIdentifier = (requirement: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            return requirementConfig.key;
        };

        const getNotificationMessage = (selectorMap: DictionaryStringTo<any>, requirement?: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            if (requirementConfig.getNotificationMessage == null) {
                return null;
            }
            return requirementConfig.getNotificationMessage(selectorMap);
        };

        const visualizationConfiguration: AssesssmentVisualizationConfiguration = {
            getTestView: props => <AssessmentTestView {...props} />,
            getStoreData: data => data.assessments[`${key}Assessment`],
            enableTest: AssessmentBuilder.enableTest,
            disableTest: AssessmentBuilder.disableTest,
            getTestStatus: AssessmentBuilder.getTestStatus,
            getAssessmentData: data => data.assessments[key],
            key: `${key}Assessment`,
            getAnalyzer: getAnalyzer,
            getIdentifier: getIdentifier,
            visualizationInstanceProcessor: () => VisualizationInstanceProcessor.nullProcessor,
            getDrawer: provider => provider.createNullDrawer(),
            getNotificationMessage: getNotificationMessage,
            getSwitchToTargetTabOnScan: this.getSwitchToTargetTabOnScan(requirements),
            getInstanceIdentiferGenerator: this.getInstanceIdentifier(requirements),
            getUpdateVisibility: this.getUpdateVisibility(requirements),
        };

        this.buildRequirementReportDescription(requirements);

        return {
            getVisualizationConfiguration: () => visualizationConfiguration,
            requirementOrder: RequirementComparer.byOrdinal,
            ...assessment,
        } as Assessment;
    }

    public static Assisted(assessment: AssistedAssessment): Assessment {
        const { key, requirements } = assessment;

        assessment.requirementOrder = assessment.requirementOrder || RequirementComparer.byOrdinal;
        assessment.initialDataCreator = assessment.initialDataCreator || createInitialAssessmentTestData;

        requirements.forEach(AssessmentBuilder.applyDefaultReportFieldMap);
        requirements.forEach(AssessmentBuilder.applyDefaultFunctions);

        const getAnalyzer = (provider: AnalyzerProvider, requirement: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            if (requirementConfig.getAnalyzer == null) {
                return provider.createBaseAnalyzer({
                    key: requirementConfig.key,
                    testType: assessment.visualizationType,
                    analyzerMessageType: Messages.Assessment.AssessmentScanCompleted,
                });
            }
            return requirementConfig.getAnalyzer(provider);
        };

        const getIdentifier = (requirement: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            return requirementConfig.key;
        };

        const getDrawer = (provider: DrawerProvider, requirement: string, featureFlagStoreData?: FeatureFlagStoreData) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            if (requirementConfig.getDrawer == null) {
                return provider.createNullDrawer();
            }
            return requirementConfig.getDrawer(provider, featureFlagStoreData);
        };

        const getNotificationMessage = (selectorMap: DictionaryStringTo<any>, requirement?: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            if (requirementConfig.getNotificationMessage == null) {
                return null;
            }
            return requirementConfig.getNotificationMessage(selectorMap);
        };

        assessment.executeAssessmentScanPolicy = assessment.executeAssessmentScanPolicy || AssessmentBuilder.nullScanPolicy;

        const visualizationConfiguration: AssesssmentVisualizationConfiguration = {
            getTestView: props => <AssessmentTestView {...props} />,
            getAssessmentData: data => data.assessments[key],
            setAssessmentData: (data, selectorMap, instanceMap) => {
                const thisAssessment = data.assessments[key];
                thisAssessment.fullAxeResultsMap = selectorMap;
                thisAssessment.generatedAssessmentInstancesMap = instanceMap;
            },
            getStoreData: data => data.assessments[assessment.storeDataKey],
            enableTest: AssessmentBuilder.enableTest,
            disableTest: AssessmentBuilder.disableTest,
            getTestStatus: AssessmentBuilder.getTestStatus,
            resultProcessor: (scanner: ScannerUtils) => scanner.getAllCompletedInstances,
            telemetryProcessor: factory => factory.forAssessmentRequirementScan,
            ...assessment.visualizationConfiguration,
            key: assessment.storeDataKey,
            getAnalyzer: getAnalyzer,
            getIdentifier: getIdentifier,
            visualizationInstanceProcessor: AssessmentBuilder.getVisualizationInstanceProcessor(requirements),
            getDrawer: getDrawer,
            getNotificationMessage: getNotificationMessage,
            getSwitchToTargetTabOnScan: AssessmentBuilder.getSwitchToTargetTabOnScan(requirements),
            getInstanceIdentiferGenerator: AssessmentBuilder.getInstanceIdentifier(requirements),
            getUpdateVisibility: AssessmentBuilder.getUpdateVisibility(requirements),
        } as AssesssmentVisualizationConfiguration;

        AssessmentBuilder.buildRequirementReportDescription(requirements);

        return {
            getVisualizationConfiguration: () => visualizationConfiguration,
            ...assessment,
        } as Assessment;
    }

    private static getRequirementConfig(requirements: Requirement[], requirementKey: string): Requirement {
        return requirements.find(req => req.key === requirementKey);
    }

    private static getVisualizationInstanceProcessor(
        requirements: Requirement[],
    ): (requirement: string) => VisualizationInstanceProcessorCallback<PropertyBags, PropertyBags> {
        return (requirementKey: string): VisualizationInstanceProcessorCallback<PropertyBags, PropertyBags> => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirementKey);
            if (requirementConfig == null || requirementConfig.visualizationInstanceProcessor == null) {
                return VisualizationInstanceProcessor.nullProcessor;
            }
            return requirementConfig.visualizationInstanceProcessor;
        };
    }

    private static getSwitchToTargetTabOnScan(requirements: Requirement[]): (requirementKey: string) => boolean {
        return (requirement: string): boolean => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirement);
            if (requirementConfig == null || requirementConfig.switchToTargetTabOnScan == null) {
                return false;
            }
            return requirementConfig.switchToTargetTabOnScan;
        };
    }

    private static getInstanceIdentifier(
        requirements: Requirement[],
    ): (requirement: string) => (instance: UniquelyIdentifiableInstances) => string {
        return (requirementKey: string) => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirementKey);
            if (requirementConfig == null || requirementConfig.generateInstanceIdentifier == null) {
                return InstanceIdentifierGenerator.defaultHtmlSelectorIdentifier;
            }
            return requirementConfig.generateInstanceIdentifier;
        };
    }

    private static buildRequirementReportDescription(requirements: Requirement[]): void {
        requirements.forEach(requirement => {
            requirement.renderReportDescription = () => {
                const descriptionCopy = _.cloneDeep(requirement.description);
                const children = AssessmentBuilder.removeLastDotFromDescription(descriptionCopy.props.children);
                descriptionCopy.props.children = children;

                return descriptionCopy;
            };
        });
    }

    private static removeLastDotFromDescription(children: any): any {
        if (Array.isArray(children)) {
            children[children.length - 1] = AssessmentBuilder.removeLastDotFromDescription(children[children.length - 1]);
        } else if (children instanceof Object) {
            children.props.children = AssessmentBuilder.removeLastDotFromDescription(children.props.children);
        } else if (children[children.length - 1] === '.') {
            children = children.slice(0, -1);
        }

        return children;
    }

    private static getUpdateVisibility(requirements: Requirement[]): (requirement: string) => boolean {
        return (requirementKey: string): boolean => {
            const requirementConfig = AssessmentBuilder.getRequirementConfig(requirements, requirementKey);
            if (requirementConfig == null || requirementConfig.updateVisibility == null) {
                return true;
            }
            return requirementConfig.updateVisibility;
        };
    }

    private static nullScanPolicy(scan, data): void {}
}
