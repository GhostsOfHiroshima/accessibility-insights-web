// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IMock, It, Mock } from 'typemoq';

import { BrowserAdapter } from '../../../../background/browser-adapters/browser-adapter';
import { CommandsAdapter } from '../../../../background/browser-adapters/commands-adapter';
import { StorageAdapter } from '../../../../background/browser-adapters/storage-adapter';
import { PersistedData } from '../../../../background/get-persisted-data';
import { GlobalContext } from '../../../../background/global-context';
import { GlobalContextFactory } from '../../../../background/global-context-factory';
import { Interpreter } from '../../../../background/interpreter';
import { LocalStorageData } from '../../../../background/storage-data';
import { CommandStore } from '../../../../background/stores/global/command-store';
import { FeatureFlagStore } from '../../../../background/stores/global/feature-flag-store';
import { LaunchPanelStore } from '../../../../background/stores/global/launch-panel-store';
import { TelemetryEventHandler } from '../../../../background/telemetry/telemetry-event-handler';
import { EnvironmentInfo } from '../../../../common/environment-info-provider';
import { IndexedDBAPI } from '../../../../common/indexedDB/indexedDB';
import { TelemetryDataFactory } from '../../../../common/telemetry-data-factory';
import { IssueFilingServiceProvider } from '../../../../issue-filing/issue-filing-service-provider';
import { CreateTestAssessmentProvider } from '../../common/test-assessment-provider';

describe('GlobalContextFactoryTest', () => {
    let browserAdapterMock: IMock<BrowserAdapter>;
    let commandsAdapterMock: IMock<CommandsAdapter>;
    let storageAdapterMock: IMock<StorageAdapter>;
    let telemetryEventHandlerMock: IMock<TelemetryEventHandler>;
    let telemetryDataFactoryMock: IMock<TelemetryDataFactory>;
    let issueFilingServiceProviderMock: IMock<IssueFilingServiceProvider>;
    let environmentInfoStub: EnvironmentInfo;
    let userDataStub: LocalStorageData;
    let idbInstance: IndexedDBAPI;
    let persistedDataStub: PersistedData;

    beforeAll(() => {
        storageAdapterMock = Mock.ofType<StorageAdapter>();
        browserAdapterMock = Mock.ofType<BrowserAdapter>();
        commandsAdapterMock = Mock.ofType<CommandsAdapter>();
        browserAdapterMock.setup(adapter => adapter.sendMessageToAllFramesAndTabs(It.isAny()));
        telemetryEventHandlerMock = Mock.ofType(TelemetryEventHandler);
        telemetryDataFactoryMock = Mock.ofType(TelemetryDataFactory);
        issueFilingServiceProviderMock = Mock.ofType(IssueFilingServiceProvider);

        userDataStub = {};
        environmentInfoStub = {} as EnvironmentInfo;
        persistedDataStub = {} as PersistedData;
        idbInstance = {} as IndexedDBAPI;
    });

    it('createContext', () => {
        const globalContext = GlobalContextFactory.createContext(
            browserAdapterMock.object,
            telemetryEventHandlerMock.object,
            userDataStub,
            CreateTestAssessmentProvider(),
            telemetryDataFactoryMock.object,
            idbInstance,
            persistedDataStub,
            issueFilingServiceProviderMock.object,
            environmentInfoStub,
            storageAdapterMock.object,
            commandsAdapterMock.object,
        );

        expect(globalContext).toBeInstanceOf(GlobalContext);
        expect(globalContext.interpreter).toBeInstanceOf(Interpreter);
        expect(globalContext.stores.commandStore).toBeInstanceOf(CommandStore);
        expect(globalContext.stores.featureFlagStore).toBeInstanceOf(FeatureFlagStore);
        expect(globalContext.stores.launchPanelStore).toBeInstanceOf(LaunchPanelStore);
    });
});
