// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IMock, It, Mock, MockBehavior, Times } from 'typemoq';
import { AssessmentsProvider } from '../../../../../assessments/types/assessments-provider';
import { AssessmentStoreData } from '../../../../../common/types/store-data/assessment-result-data';
import { FeatureFlagStoreData } from '../../../../../common/types/store-data/feature-flag-store-data';
import { TabStoreData } from '../../../../../common/types/store-data/tab-store-data';
import { AssessmentReportHtmlGenerator } from '../../../../../DetailsView/reports/assessment-report-html-generator';
import { ReportGeneratorV1 } from '../../../../../DetailsView/reports/report-generator-v1';
import { ReportHtmlGeneratorV1 } from '../../../../../DetailsView/reports/report-html-generator-v1';
import { ReportNameGenerator } from '../../../../../DetailsView/reports/report-name-generator';
import { ScanResults } from '../../../../../scanner/iruleresults';

describe('ReportGeneratorV1', () => {
    const scanResult: ScanResults = {} as any;
    const date = new Date(2018, 2, 12, 15, 46);
    const title = 'title';
    const url = 'http://url/';
    const description = 'description';

    let dataBuilderMock: IMock<ReportHtmlGeneratorV1>;
    let nameBuilderMock: IMock<ReportNameGenerator>;
    let assessmentReportHtmlGeneratorMock: IMock<AssessmentReportHtmlGenerator>;

    beforeEach(() => {
        nameBuilderMock = Mock.ofType(ReportNameGenerator, MockBehavior.Strict);
        dataBuilderMock = Mock.ofType(ReportHtmlGeneratorV1, MockBehavior.Strict);
        assessmentReportHtmlGeneratorMock = Mock.ofType(AssessmentReportHtmlGenerator, MockBehavior.Strict);
    });

    afterEach(() => {
        dataBuilderMock.verifyAll();
        nameBuilderMock.verifyAll();
    });

    test('generateHtml', () => {
        dataBuilderMock
            .setup(builder =>
                builder.generateHtml(
                    It.isObjectWith(scanResult),
                    It.isValue(date),
                    It.isValue(title),
                    It.isValue(url),
                    It.isValue(description),
                ),
            )
            .returns(() => 'returned-data')
            .verifiable(Times.once());

        const testObject = new ReportGeneratorV1(nameBuilderMock.object, dataBuilderMock.object, assessmentReportHtmlGeneratorMock.object);
        const actual = testObject.generateFastPassAutomateChecksReport(scanResult, date, title, url, description);

        const expected = 'returned-data';
        expect(actual).toEqual(expected);
    });

    test('generateAssessmentHtml', () => {
        const assessmentStoreData: AssessmentStoreData = { stub: 'assessmentStoreData' } as any;
        const assessmentsProvider: AssessmentsProvider = { stub: 'assessmentsProvider' } as any;
        const featureFlagStoreData: FeatureFlagStoreData = { stub: 'featureFlagStoreData' } as any;
        const tabStoreData: TabStoreData = { stub: 'tabStoreData' } as any;
        const assessmentDescription = 'generateAssessmentHtml-description';

        assessmentReportHtmlGeneratorMock
            .setup(builder =>
                builder.generateHtml(assessmentStoreData, assessmentsProvider, featureFlagStoreData, tabStoreData, assessmentDescription),
            )
            .returns(() => 'generated-assessment-html')
            .verifiable(Times.once());

        const testObject = new ReportGeneratorV1(nameBuilderMock.object, dataBuilderMock.object, assessmentReportHtmlGeneratorMock.object);
        const actual = testObject.generateAssessmentReport(
            assessmentStoreData,
            assessmentsProvider,
            featureFlagStoreData,
            tabStoreData,
            assessmentDescription,
        );

        const expected = 'generated-assessment-html';
        expect(actual).toEqual(expected);
    });

    test('generateName', () => {
        nameBuilderMock
            .setup(builder => builder.generateName('InsightsScan', It.isValue(date), It.isValue(title)))
            .returns(() => 'returned-name')
            .verifiable(Times.once());

        const testObject = new ReportGeneratorV1(nameBuilderMock.object, dataBuilderMock.object, assessmentReportHtmlGeneratorMock.object);
        const actual = testObject.generateName('InsightsScan', date, title);

        const expected = 'returned-name';
        expect(actual).toEqual(expected);
    });
});
