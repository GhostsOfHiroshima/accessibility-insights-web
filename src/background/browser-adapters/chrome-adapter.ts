// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { ClientChromeAdapter } from '../../common/client-browser-adapter';
import { BrowserAdapter, NotificationOptions } from './browser-adapter';
import { CommandsAdapter } from './commands-adapter';
import { StorageAdapter } from './storage-adapter';

export class ChromeAdapter extends ClientChromeAdapter implements BrowserAdapter, StorageAdapter, CommandsAdapter {
    public openManageExtensionPage(): void {
        chrome.tabs.create({
            url: `chrome://extensions/?id=${chrome.runtime.id}`,
        });
    }

    public getAllWindows(getInfo: chrome.windows.GetInfo, callback: (chromeWindows: chrome.windows.Window[]) => void): void {
        chrome.windows.getAll(getInfo, callback);
    }

    public getSelectedTabInWindow(windowId: number, callback: (activeTab: chrome.tabs.Tab) => void): void {
        chrome.tabs.getSelected(windowId, callback);
    }

    public addListenerToTabsOnActivated(callback: (activeInfo: chrome.tabs.TabActiveInfo) => void): void {
        chrome.tabs.onActivated.addListener(callback);
    }

    public addListenerToTabsOnUpdated(
        callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void,
    ): void {
        chrome.tabs.onUpdated.addListener(callback);
    }

    public addListenerToWebNavigationUpdated(callback: (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => void): void {
        chrome.webNavigation.onDOMContentLoaded.addListener(callback);
    }

    public addListenerToTabsOnRemoved(callback: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void): void {
        chrome.tabs.onRemoved.addListener(callback);
    }

    public addListenerOnWindowsFocusChanged(callback: (windowId: number) => void): void {
        chrome.windows.onFocusChanged.addListener(callback);
    }

    public getRunTimeId(): string {
        return chrome.runtime.id;
    }
    public tabsQuery(query: chrome.tabs.QueryInfo, callback: (result: chrome.tabs.Tab[]) => void): void {
        chrome.tabs.query(query, callback);
    }

    public getTab(tabId: number, onResolve: (tab: chrome.tabs.Tab) => void, onReject?: () => void): void {
        chrome.tabs.get(tabId, tab => {
            if (tab) {
                onResolve(tab);
            } else {
                onReject();
            }
        });
    }

    public injectJs(tabId, file: string, callback?: (result: any[]) => void): void {
        chrome.tabs.executeScript(
            tabId,
            {
                allFrames: true,
                file: file,
                runAt: 'document_start',
            },
            callback,
        );
    }
    public injectCss(tabId, file: string, callback?: Function): void {
        chrome.tabs.insertCSS(
            tabId,
            {
                allFrames: true,
                file: file,
            },
            callback,
        );
    }

    public createTab(url: string, callback?: (tab: chrome.tabs.Tab) => void): void {
        chrome.tabs.create(
            {
                url: url,
                active: true,
                pinned: false,
            },
            callback,
        );
    }

    public createTabInNewWindow(url: string, callback?: (tab: chrome.tabs.Tab) => void): void {
        chrome.windows.create(
            {
                url: url,
                focused: true,
            },
            window => {
                callback(window.tabs[0]);
            },
        );
    }

    public createInactiveTab(url: string, callback: (tab: chrome.tabs.Tab) => void): void {
        chrome.tabs.create(
            {
                url: url,
                active: false,
                pinned: false,
            },
            callback,
        );
    }

    public closeTab(tabId: number): void {
        chrome.tabs.remove(tabId);
    }

    public switchToTab(tabId: number): void {
        const props = {
            active: true,
        };

        chrome.tabs.update(tabId, props, tab => {
            chrome.windows.update(tab.windowId, { focused: true });
        });
    }

    public sendMessageToFramesAndTab(tabId: number, message: any): void {
        chrome.runtime.sendMessage(message);
        chrome.tabs.sendMessage(tabId, message);
    }

    public sendMessageToAllFramesAndTabs(message: any): void {
        chrome.runtime.sendMessage(message);

        chrome.tabs.query({}, tabs => {
            for (let i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, message);
            }
        });
    }

    public sendMessageToFrames(message: any): void {
        chrome.runtime.sendMessage(message);
    }

    public setUserData(items: Object, callback?: () => void): void {
        chrome.storage.local.set(items, callback);
    }

    public getUserData(keys: string | string[] | Object, callback: (items: { [key: string]: any }) => void): void {
        chrome.storage.local.get(keys, callback);
    }

    public removeUserData(key: string): void {
        chrome.storage.local.remove(key);
    }

    public getRuntimeLastError(): chrome.runtime.LastError {
        return chrome.runtime.lastError;
    }

    public createNotification(options: NotificationOptions): void {
        chrome.notifications.create({
            type: options.notificationType || 'basic',
            iconUrl: options.iconUrl,
            title: options.title,
            message: options.message,
        });
    }

    public isAllowedFileSchemeAccess(callback: (isAllowed: boolean) => void): void {
        chrome.extension.isAllowedFileSchemeAccess(callback);
    }

    public addListenerToLocalStorage(callback: (changes: object) => void): void {
        chrome.storage.onChanged.addListener(callback);
    }

    public addCommandListener(callback: (command: string) => void): void {
        chrome.commands.onCommand.addListener(callback);
    }

    public getCommands(callback: (commands: chrome.commands.Command[]) => void): void {
        chrome.commands.getAll(callback);
    }
}
