import { Plugin } from "obsidian";
import path from "path";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);

// Remember to rename these classes and interfaces!

interface JournalPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: JournalPluginSettings = {
  mySetting: "default",
};

export default class JournalPlugin extends Plugin {
  settings: JournalPluginSettings;

  async onload() {
    const app = this.app;

    const { vault } = app;

    await this.loadSettings();

    // This creates an icon in the left ribbon.
    this.addRibbonIcon("dice", "Quick Journal", async (evt: MouseEvent) => {
      const year = dayjs().year().toString();
      const month = (dayjs().month() + 1).toString();
      const date = dayjs().date().toString();
      const week = dayjs().week().toString();

      const rootPath = vault.getRoot().path;
      const newFileFolderPath = path.join(
        rootPath,
        "Journal",
        year,
        `W${week}`
      );
      const newFilePath = path.join(newFileFolderPath, `${month}-${date}.md`);
      const journalPathRegExp = /^(Journal)\/2[0-9]{3}\/W[0-9]{2}\/(0|1)[0-9]-(0|1|2|3)[0-9](.md)$/;

      const preJournalFile = vault
        .getMarkdownFiles()
        .find((file) => journalPathRegExp.test(`${file.path}`));
      
      if (preJournalFile) {
        const preJournalContent = await vault.read(preJournalFile);
        vault.createFolder(newFileFolderPath).then(
          () => console.log("Directory created successfully!"),
          () =>
            console.log("Failed to create directory, directory already exists!")
        );
        vault.create(newFilePath, preJournalContent).then(
          (file) => {
            console.log("Journal created successfully!");
            app.workspace.getLeaf().openFile(file);
          },
          () => console.log("Failed to create journal, journal already exists!")
        );
      } else {
        throw Error("Yesterday's journal does not exist!");
      }
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
