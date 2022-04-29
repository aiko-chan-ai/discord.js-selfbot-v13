import axios from 'axios';
import chalk from 'chalk';
import ascii from 'ascii-table';
import path from 'path';
import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const table = new ascii('NPM Check Update by Shiraori#1782');
table.setHeading("Modules", "Current", chalk.whiteBright("Lastest"));
let cmd1 = '';
let cmd2 = '';
let cmd3 = '';
const func = async (package_ , current , array_ , start) => {
    current = current.replace("^", "");
    if(current.split(".").length == 1) current += ".0.0";
    if(current.split(".").length == 2) current += ".0";
    const array = []
    try {
        const res_ = await axios.get(`https://registry.npmjs.com/${encodeURIComponent(package_)}`);
        const lastest_tag = res_.data['dist-tags'].latest;
        // Checking if the package is outdated
        if (current !== lastest_tag) {
            const current_ = current.split('.');
            const lastest_ = lastest_tag.split('.');
            if (current_[0] !== lastest_[0]) {
                array.push(`${package_}`);
                array.push(`^${current}`);
                array.push(`^${chalk.redBright(lastest_tag)}`);
                cmd1 += `${package_}@${lastest_tag} `;
            } else if (current_[1] !== lastest_[1]) {
                array.push(`${package_}`);
                array.push(`^${current}`);
                array.push(`^${lastest_[0]}.${chalk.blueBright(`${lastest_[1]}.${lastest_[2]}`)}`);
                cmd2 += `${package_}@${lastest_tag} `;
            } else if (current_[2] !== lastest_[2]) {
                array.push(`${package_}`);
                array.push(`^${current}`);
                array.push(`^${lastest_[0]}.${lastest_[1]}.${chalk.greenBright(lastest_[2])}`);
                cmd3 += `${package_}@${lastest_tag} `;
            }
        }
        return array[0] ? array : false;
    } catch (e) {
        console.log(e.message);
        return false
    }
}
  try {
    let start = 1;
    let time = Date.now();
    const { dependencies } = require('./package.json');
    (async () => {
        const array = Object.entries(dependencies);
        console.log(`Checking ${path.join(__dirname, 'package.json')}, ${array.length} modules`);
        await Promise.all(array.map(async arr => {
          const result = await func(arr[0] , arr[1] , array , start);
          start++;
          if(result) table.addRow(result[0].replace(/\n/g, ""), result[1].replace(/\n/g, ""), result[2].replace(/\n/g, ""));
          return 0;
        }))
        console.log(`Checking Success with ${(Date.now() - time) / 1000}s\n`);
        if(cmd1 == cmd2 && cmd2 == cmd3 && cmd3 == '') {
            console.log(chalk.greenBright(`All modules are up to date`));
        } else {
            console.log(table.toString());
            console.log('You should update the following modules:');
            if(cmd1 !== '') console.log(chalk.redBright(`npm i ${cmd1}`));
            if(cmd2 !== '') console.log(chalk.blueBright(`npm i ${cmd2}`));
            if(cmd3 !== '') console.log(chalk.greenBright(`npm i ${cmd3}`));
        }
    })()
} catch {
    console.error('package.json not found');
}