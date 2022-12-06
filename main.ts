import { Plugin, TFile } from "obsidian";
import path from "path";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);

interface JournalPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: JournalPluginSettings = {
  mySetting: "default",
};

export default class JournalPlugin extends Plugin {
  settings: JournalPluginSettings;

  getPreJournalFile(): TFile | undefined {
    const journalPathRegExp =
      /^(Journal)\/2[0-9]{3}\/W[0-9]{2}\/(0|1)[0-9]-(0|1|2|3)[0-9](.md)$/;

    const preJournalFile = this.app.vault
      .getMarkdownFiles()
      .find((file) => journalPathRegExp.test(`${file.path}`));

    return preJournalFile;
  }

  async onload() {
    await this.loadSettings();

    const vault = this.app.vault;

    this.addRibbonIcon("dice", "Quick Journal", async (evt: MouseEvent) => {
      const year = dayjs().year().toString();
      const month = (dayjs().month() + 1).toString().padStart(2, "0");
      const date = dayjs().date().toString().padStart(2, "0");
      const week = dayjs().week().toString().padStart(2, "0");

      const rootPath = vault.getRoot().path;
      const newFileFolderPath = path.join(
        rootPath,
        "Journal",
        year,
        `W${week}`
      );
      const newFilePath = path.join(newFileFolderPath, `${month}-${date}.md`);
      const preJournalFile = this.getPreJournalFile();

      if (preJournalFile) {
        await this.createJournal(
          preJournalFile,
          newFileFolderPath,
          newFilePath
        );
      } else {
        throw Error("Yesterday's journal does not exist!");
      }
    });
  }

  async createJournal(
    preJournalFile: TFile,
    newFileFolderPath: string,
    newFilePath: string
  ) {
    const vault = this.app.vault;

    const preJournalContent = await vault.read(preJournalFile);

    vault.createFolder(newFileFolderPath).then(
      () => console.log("Directory created successfully!"),
      () => console.log("Failed to create directory, directory already exists!")
    );

    vault.create(newFilePath, preJournalContent).then(
      (file) => {
        this.openFileInVault(file);
        console.log("Journal created successfully!");
      },
      () => console.log("Failed to create journal, journal already exists!")
    );
  }

  async openFileInVault(file: TFile) {
    this.app.workspace.getLeaf().openFile(file);
  }

  async onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
