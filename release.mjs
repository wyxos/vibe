import chalk from "chalk";
import inquirer from "inquirer";
import {execSync} from "child_process";
import simpleGit from "simple-git";
import fs from "fs";

const git = simpleGit();

const packageJsonPath = "./package.json";
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
const currentVersion = packageJson.version;

let defaultVersion = currentVersion.split(".");
defaultVersion[defaultVersion.length - 1] = Number(defaultVersion[defaultVersion.length - 1]) + 1;
defaultVersion = defaultVersion.join(".");

const {version} = await inquirer.prompt([
    {
        name: "version",
        message: `Enter the version to publish (current ${currentVersion})`,
        default: defaultVersion
    }
]);

const tagVersion = `v${version}`;
const commitMessage = `feat: release ${tagVersion}`;

const execSyncOut = (command) => {
    execSync(command, {stdio: "inherit"});
};

// check if directory clean
const status = await git.status();
if (status.files.length > 0) {
    // list files and ask for commit message
    console.log(chalk.red("You have uncommitted changes"));
    console.log(status.files);
    const {commitMessage} = await inquirer.prompt([
        {
            name: "commitMessage",
            message: "Enter the commit message"
        }
    ]);
    await git.add(".");
    await git.commit(commitMessage);

}

// if script has lint
if (packageJson.scripts.lint) {
// Run linting
    execSyncOut("npm run lint");

// Check for changes
    const status = await git.status();
    if (status.modified.length > 0) {
        await git.add(".");
        // Commit the changes
        await git.commit("chore: lint fixes");
    }
}

// Build the project
execSyncOut("npm run build");

// Update the version
execSyncOut(`npm version ${version} -m "${commitMessage}"`);

const commitFiles = async () => {
    await git.add(".");
    await git.commit(commitMessage);
};

const pushChanges = async () => {
    // get current branch
    const branch = (await git.branch()).current;
    await git.push("origin", branch);
    await git.pushTags("origin");
};

const release = async () => {
    try {
        await commitFiles();
        await pushChanges();
        console.log(chalk.green(`Successfully released version ${version}`));
        console.log(chalk.green("Publishing to npm..."));
        // execSyncOut("npm login");
        execSyncOut("npm publish --access public --verbose");

        // npx gh-pages -d dist
        execSyncOut("npx gh-pages -d dist");

        console.log(chalk.green("Published to npm"));
    } catch (error) {
        console.error(chalk.red("Release process failed. Error:", error));
    }
};

release();
