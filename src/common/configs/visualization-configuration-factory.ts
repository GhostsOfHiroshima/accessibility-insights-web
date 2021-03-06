// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as _ from 'lodash';

import { ColorAdHocVisualization } from '../../ad-hoc-visualizations/color/visualization';
import { HeadingsAdHocVisualization } from '../../ad-hoc-visualizations/headings/visualization';
import { IssuesAdHocVisualization } from '../../ad-hoc-visualizations/issues/visualization';
import { LandmarksAdHocVisualization } from '../../ad-hoc-visualizations/landmarks/visualization';
import { TabStopsAdHocVisualization } from '../../ad-hoc-visualizations/tab-stops/visualization';
import { Assessments } from '../../assessments/assessments';
import { DictionaryNumberTo, DictionaryStringTo } from '../../types/common-types';
import { EnumHelper } from '../enum-helper';
import { VisualizationType } from '../types/visualization-type';
import { TestMode } from './test-mode';
import { VisualizationConfiguration } from './visualization-configuration';

export interface DisplayableVisualizationTypeData {
    title: string;
    subtitle?: JSX.Element;
    enableMessage: string;
    toggleLabel: string;
    linkToDetailsViewText: string;
}

export class VisualizationConfigurationFactory {
    private configurationByType: DictionaryNumberTo<VisualizationConfiguration>;

    constructor() {
        this.configurationByType = {
            [VisualizationType.Color]: ColorAdHocVisualization,
            [VisualizationType.Headings]: HeadingsAdHocVisualization,
            [VisualizationType.Issues]: IssuesAdHocVisualization,
            [VisualizationType.Landmarks]: LandmarksAdHocVisualization,
            [VisualizationType.TabStops]: TabStopsAdHocVisualization,
        };
    }

    public getConfigurationByKey(key: string): VisualizationConfiguration {
        return _.find(_.values(this.configurationByType), config => config.key === key);
    }

    public getConfiguration(visualizationType: VisualizationType): VisualizationConfiguration {
        if (Assessments.isValidType(visualizationType)) {
            const assessment = Assessments.forType(visualizationType);
            const defaults = {
                testMode: TestMode.Assessments,
                chromeCommand: null,
                launchPanelDisplayOrder: null,
                adhocToolsPanelDisplayOrder: null,
                displayableData: {
                    title: assessment.title,
                    noResultsFound: null,
                    enableMessage: null,
                    toggleLabel: null,
                    linkToDetailsViewText: null,
                },
            };
            const config = assessment.getVisualizationConfiguration();
            return { ...config, ...defaults };
        }

        const configuration = this.configurationByType[visualizationType];

        if (configuration == null) {
            throw new Error(`Unsupported type: ${visualizationType}`);
        }

        return configuration;
    }

    public getChromeCommandToVisualizationTypeMap(): DictionaryStringTo<VisualizationType> {
        const map: DictionaryStringTo<VisualizationType> = {};

        const types = EnumHelper.getNumericValues<VisualizationType>(VisualizationType);

        _.each(types, visualizationType => {
            const configuration = this.configurationByType[visualizationType];

            if (configuration && configuration.chromeCommand != null) {
                map[configuration.chromeCommand] = visualizationType;
            }
        });

        return map;
    }
}
