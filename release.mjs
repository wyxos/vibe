import chalk from "chalk";
import inquirer from "inquirer";
import {execSync} from "child_process";
import simpleGit from "simple-git";
import fs from "fs";

const commitFiles = async (message) => {
    await git.add(".");
    await git.commit(message);
};

const pushChanges = async () => {
    // get current branch
    const branch = (await git.branch()).current;
    await git.push("origin", branch);
    await git.pushTags("origin");
};

const release = async () => {
    try {
        await commitFiles('chore: release');
        await pushChanges();
        console.log(chalk.green(`Successfully released version ${version}`));
        console.log(chalk.green("Publishing to npm..."));
        // execSyncOut("npm login");
        execSyncOut("npm publish --access public --verbose");

        console.log(chalk.green("Published to npm"));
    } catch (error) {
        console.error(chalk.red("Release process failed. Error:", error));
    }
};

async function lint() {
    // if script has lint
    if (packageJson.scripts.lint) {
// Run linting
        execSyncOut("npm run lint");

// Check for changes
        const status = await git.status();
        if (status.modified.length > 0) {
            await commitFiles('chore: lint fixes');
        }
    }
}

async function build(){
    // Build the project
    execSyncOut("npm run build");

    await commitFiles('chore: build');
}

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

await lint();

await build()

// write CNAME file to /dist containing vue-infinite-masonry.wyxos.com
fs.writeFileSync("./dist/CNAME", "vibe.wyxos.com");

await commitFiles(`chore: add CNAME file`);

// execute  npx gh-pages -d dist
execSyncOut("npx gh-pages -d dist");

// Update the version
execSyncOut(`npm version ${version} -m "${commitMessage}"`);

await release();
