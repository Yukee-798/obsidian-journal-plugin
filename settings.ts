import JournalPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface JournalPluginSettings {
  journalRootPath: string;
}

export const DEFAULT_SETTINGS: JournalPluginSettings = {
  journalRootPath: "/Journal",
};

export default class JournalSettingTab extends PluginSettingTab {
  plugin: JournalPlugin;

  constructor(app: App, plugin: JournalPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Journal Root Path")
      .setDesc("Directory where journals' root is located.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.journalRootPath)
          .onChange(async (value) => {
            this.plugin.settings.journalRootPath = value;
            await this.plugin.saveSettings();
          })
      ); 
  }
}

