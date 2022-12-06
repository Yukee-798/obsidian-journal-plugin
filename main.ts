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

  getLastJournalFile(): TFile | undefined {
    const journalPathRegExp =
      /^(Journal)\/2[0-9]{3}\/W[0-9]{2}\/(0|1)[0-9]-(0|1|2|3)[0-9](.md)$/;

    const lastJournalFile = this.app.vault
      .getMarkdownFiles()
      .find((file) => journalPathRegExp.test(`${file.path}`));

    return lastJournalFile;
  }

  isNewJournalCreated(date: string): boolean {
    const lastJournalFile = this.getLastJournalFile();
    if (lastJournalFile) {
      return date === lastJournalFile.basename;
    } else {
      throw Error("LastJournalFile is not existed.");
    }
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
      const newJournalPath = path.join(
        newFileFolderPath,
        `${month}-${date}.md`
      );
      const lastJournalFile = this.getLastJournalFile();

      if (this.isNewJournalCreated(`${month}-${date}`)) {
        if (lastJournalFile) {
          this.openFileInVault(lastJournalFile);
        } else {
          throw Error("LastJournalFile is not existed.");
        }
      } else {
        if (lastJournalFile) {
          await this.createJournal(
            lastJournalFile,
            newFileFolderPath,
            newJournalPath
          );
        } else {
          throw Error("Yesterday's journal does not exist!");
        }
      }
    });
  }

  async createJournal(
    lastJournalFile: TFile,
    newFileFolderPath: string,
    newJournalPath: string
  ) {
    const vault = this.app.vault;

    const preJournalContent = await vault.read(lastJournalFile);

    vault.createFolder(newFileFolderPath).then(
      () => console.log("Directory created successfully!"),
      () => console.log("Failed to create directory, directory already exists!")
    );

    vault.create(newJournalPath, preJournalContent).then(
      async (file) => {
        await this.openFileInVault(file);
        console.log("Journal created successfully!");
      },
      () => console.log("Failed to create journal, journal already exists!")
    );
  }

  async openFileInVault(file: TFile) {
    return this.app.workspace.getLeaf().openFile(file);
  }

  async onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
