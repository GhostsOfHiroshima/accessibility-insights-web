// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { isEmpty } from 'lodash';
import * as React from 'react';

import { GuidanceLink } from '../../scanner/rule-to-links-mappings';
import { GetGuidanceTagsFromGuidanceLinks } from '../get-guidance-tags-from-guidance-links';
import { NamedSFC } from '../react/named-sfc';

export interface GuidanceTagsDeps {
    getGuidanceTagsFromGuidanceLinks: GetGuidanceTagsFromGuidanceLinks;
}
export interface GuidanceTagsProps {
    deps: GuidanceTagsDeps;
    links: GuidanceLink[];
}

export const GuidanceTags = NamedSFC<GuidanceTagsProps>('GuidanceTags', props => {
    const { links, deps } = props;

    if (isEmpty(links)) {
        return null;
    }

    const tags = deps.getGuidanceTagsFromGuidanceLinks(links);

    if (isEmpty(tags)) {
        return null;
    }

    const tagElements = tags.map((tag, index) => {
        return <div key={index}>{tag.displayText}</div>;
    });

    return <div className="guidance-tags">{tagElements}</div>;
});
