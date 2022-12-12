import { Plugin, TFile } from "obsidian";
import path from "path";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import JournalSettingTab, {
  DEFAULT_SETTINGS,
  JournalPluginSettings,
} from "settings";

dayjs.extend(weekOfYear);

export default class JournalPlugin extends Plugin {
  settings: JournalPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("dice", "Quick Journal", this.onRibbonIconClick);
    this.addSettingTab(new JournalSettingTab(app, this));
  }

  onRibbonIconClick = async (evt: MouseEvent) => {
    const vault = this.app.vault;

    const year = dayjs().year().toString();
    const month = (dayjs().month() + 1).toString().padStart(2, "0");
    const date = dayjs().date().toString().padStart(2, "0");
    const week = dayjs().week().toString().padStart(2, "0");

    const journalRootPath = this.settings.journalRootPath;

    const newJournalPath = path.join(
      journalRootPath,
      year,
      `W${week}`,
      `${month}-${date}.md`
    );

    const lastJournalFile = this.getLastJournalFile();

    if (lastJournalFile) {
      const isNewJournalCreated =
        lastJournalFile.basename === `${month}-${date}`;
      if (isNewJournalCreated) {
        await this.openFileInVault(lastJournalFile);
        console.log(`"${newJournalPath}" is existed.`);
      } else {
        const content = await vault.read(lastJournalFile);
        console.log(lastJournalFile);
        const journal = await this.createJournal(newJournalPath, content);
        await this.openFileInVault(journal);
      }
    } else {
      const journal = await this.createJournal(newJournalPath);
      await this.openFileInVault(journal);
    }
  };

  getLastJournalFile(): TFile | undefined {
    const journalPathRegExp = new RegExp(
      `^(${this.settings.journalRootPath})/2[0-9]{3}/W[0-9]{2}/(0|1)[0-9]-(0|1|2|3)[0-9](.md)$`
    );

    const markdownFiles = this.app.vault.getMarkdownFiles();
    const journalFiles = markdownFiles.filter((file) =>
      journalPathRegExp.test(`/${file.path}`)
    );

    const journalDateNums = journalFiles.map(this.getJournalDateNum);
    const maxDateNumber = Math.max(...journalDateNums);

    const lastJournalFile = journalFiles.find(
      (file) => this.getJournalDateNum(file) === maxDateNumber
    );

    return lastJournalFile;
  }

  getJournalDateNum(file: TFile) {
    const year = file.path.split("/").at(-3)!;
    const month = file.basename.split("-")[0];
    const date = file.basename.split("-")[1];
    const dateNumber = +`${year}${month}${date}`;
    return dateNumber;
  }

  async createJournal(_path: string, content: string = ""): Promise<TFile> {
    const vault = this.app.vault;

    const pathObj = path.parse(_path);

    const folders = this.getAncestorPaths(pathObj.dir);

    folders.forEach(async (folderPath) => {
      try {
        await vault.createFolder(folderPath);
      } catch {
        console.log(`"${folderPath}" is existed.`);
      }
    });

    return vault.create(_path, content);
  }

  /*
    e.g. getAncestorPaths('/root/folder1/folder2')
    [
      '/root',
      '/root/folder1',
      '/root/folder1/folder2',
    ] 
  */
  getAncestorPaths(curPath: string): string[] {
    const folderBaseNames = curPath.split("/").slice(1);
    const folders = [`/${folderBaseNames[0]}`];

    folderBaseNames.forEach((basename, i) => {
      if (i === 0) return;
      const preFolderPath = folders.at(-1)!;
      const curFolderPath = path.join(preFolderPath, basename);
      folders.push(curFolderPath);
    });

    return folders;
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
