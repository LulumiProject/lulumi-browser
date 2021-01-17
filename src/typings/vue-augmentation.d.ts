/* eslint-disable no-undef */

// eslint-disable-next-line spaced-comment
/// <reference types="electron" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vue from 'vue';

// augment types of Vue.$electron
declare module 'vue/types/vue' {
  interface BrowserWindow {
    static createWindow(
      options?: Electron.BrowserWindowConstructorOptions,
      callback?: (eventName: string) => void): Electron.BrowserWindow;
  }
  interface Remote extends Electron.Remote {
    BrowserWindow: BrowserWindow & typeof Electron.BrowserWindow;
  }
  interface MyElectron {
    clipboard: Electron.Clipboard;
    crashReporter: Electron.CrashReporter;
    desktopCapturer: Electron.DesktopCapturer;
    ipcRenderer: Electron.IpcRenderer;
    nativeImage: typeof Electron.NativeImage;
    remote: Remote;
    screen: Electron.Screen;
    shell: Electron.Shell;
    webFrame: Electron.WebFrame;
  }

  // eslint-disable-next-line no-shadow
  interface Vue {
    $electron: MyElectron;
  }
}
