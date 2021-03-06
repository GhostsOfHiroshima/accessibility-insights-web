// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { shallow } from 'enzyme';
import * as React from 'react';
import { BodySection } from '../../../../../../../DetailsView/reports/components/report-sections/body-section';

describe('BodySection', () => {
    it('renders', () => {
        const children: JSX.Element[] = [<div>1</div>, <div id="2">2</div>];

        const wrapped = shallow(<BodySection>{children}</BodySection>);

        expect(wrapped.getElement()).toMatchSnapshot();
    });
});
