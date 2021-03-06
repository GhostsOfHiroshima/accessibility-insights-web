// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { shallow } from 'enzyme';
import * as React from 'react';
import { Mock } from 'typemoq';

import { GetGuidanceTagsFromGuidanceLinks } from '../../../../../../../common/get-guidance-tags-from-guidance-links';
import {
    FailedInstancesSection,
    FailedInstancesSectionProps,
} from '../../../../../../../DetailsView/reports/components/report-sections/failed-instances-section';
import { FixInstructionProcessor } from '../../../../../../../injected/fix-instruction-processor';
import { RuleResult } from '../../../../../../../scanner/iruleresults';

describe('FailedInstancesSection', () => {
    it('renders', () => {
        const getGuidanceTagsStub: GetGuidanceTagsFromGuidanceLinks = () => [];
        const fixInstructionProcessorMock = Mock.ofType(FixInstructionProcessor);

        const props: FailedInstancesSectionProps = {
            getGuidanceTagsFromGuidanceLinks: getGuidanceTagsStub,
            fixInstructionProcessor: fixInstructionProcessorMock.object,
            scanResult: {
                violations: [{ nodes: [{}, {}] } as RuleResult, { nodes: [{}] } as RuleResult, { nodes: [{}, {}, {}] } as RuleResult],
                passes: [],
                inapplicable: [],
                incomplete: [],
                timestamp: 'today',
                targetPageTitle: 'page title',
                targetPageUrl: 'url://page.url',
            },
        };

        const wrapper = shallow(<FailedInstancesSection {...props} />);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
