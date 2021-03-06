// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { css } from '@uifabric/utilities';
import * as React from 'react';

import { NewTabLink } from '../../../../common/components/new-tab-link';
import { CommentIcon } from '../../../../common/icons/comment-icon';
import { DateIcon } from '../../../../common/icons/date-icon';
import { UrlIcon } from '../../../../common/icons/url-icon';
import { NamedSFC } from '../../../../common/react/named-sfc';
import { SectionProps } from './report-section-factory';

export type DetailsSectionProps = Pick<SectionProps, 'pageUrl' | 'description' | 'scanDate' | 'toUtcString'>;

export const DetailsSection = NamedSFC<DetailsSectionProps>('DetailsSection', props => {
    const { pageUrl, description, scanDate, toUtcString } = props;

    const createListItem = (icon: JSX.Element, label: string, content: string | JSX.Element, contentClassName?: string) => (
        <li>
            <span className="icon" aria-hidden="true">
                {icon}
            </span>
            <span className="screen-reader-only">{label}</span>
            <span className={css('text', contentClassName)}>{content}</span>
        </li>
    );

    const scanDateUTC: string = toUtcString(scanDate);
    const showCommentRow = !!description && description !== '';

    return (
        <div className="scan-details-section">
            <h2>Scan details</h2>
            <ul className="details-section-list">
                {createListItem(<UrlIcon />, 'target page:', <NewTabLink href={pageUrl}>{pageUrl}</NewTabLink>)}
                {createListItem(<DateIcon />, 'scan date:', scanDateUTC)}
                {showCommentRow && createListItem(<CommentIcon />, 'comment:', description, 'description-text')}
            </ul>
        </div>
    );
});
