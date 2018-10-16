var program = require('commander');
const fs    = require('fs')
const path  = require('path');
const url   = require('url');
const ejs   = require('ejs');
const download = require('download');
const tar = require('tar');
const ld = require('lodash');
const config = require('../package.json');
const { spawn } = require('child_process');
const rmdir = require('rmdir-promise');
const replace = require('replace-in-file');
const moment  = require('moment');
const octokit  = require('@octokit/rest')();
const util = require('util');
const unlink = util.promisify(fs.unlink);
const git = require('isomorphic-git');

git.plugins.set('fs', fs);



class Builder {
  constructor(cfg, ghToken) {
    this.config = cfg
    this.token = ghToken
  }

 
  relPath(rp) {
    return path.join(__dirname, rp)
  }

  orgUrl() {
    var u = url.parse(ld.replace(this.config.repository.url, 'git+', ''))
    var ou = new url.URL(this.config.payabbhi.org, `${u.protocol}//${u.hostname}`)
    return ou.href
  }

  templatePath(name) {
    return path.join(__dirname, 'templates', `${name}.ejs`)
  }

  shorten(s) {
    return ld.replace(s, '.', '')
  }

  iosFWPackage() {
    let xcv = this.shorten(this.config.payabbhi.deps.ios.xcodeVersion)
    return `Payabbhi-iOS-${xcv}-${this.config.payabbhi.deps.ios.version}.tar.gz`
  }

  iosFWUrl() {
    let releasesUrl = this.config.payabbhi.deps.ios.url
    let version     = this.config.payabbhi.deps.ios.version
    let fwPkg       = this.iosFWPackage()
    return `${releasesUrl}/download/v${version}/${fwPkg}`
  }

  branchName() {
    return `RELEASE_${this.pluginVersion}`
  }

  async createBranch() {
    var branchName = this.branchName()
  
    await git.branch({
    dir: path.join(__dirname, '../'),
    ref: branchName
    })

    await git.checkout({
      dir: path.join(__dirname, '../'),
      ref: branchName
    })

  }

  async updatePkjJson() {
    this.config.version = this.pluginVersion
    this.config.payabbhi.deps.android.version = this.androidSDKVersion || this.config.payabbhi.deps.android.version 
    this.config.payabbhi.deps.ios.version = this.iosSDKVersion || this.config.payabbhi.deps.ios.version 
    this.config.payabbhi.deps.ios.xcodeVersion = this.xcodeVersion || this.config.payabbhi.deps.ios.xcodeVersion 
    fs.writeFileSync('package.json', JSON.stringify(this.config, null, 2))
  }

  async removePreviousFW() {
    await rmdir(path.join(__dirname, '../src/ios/Payabbhi.framework'))
  }

  async downloadIosFW() {
    console.log('downloading', this.iosFWUrl())
    await download(
      this.iosFWUrl(), 
      path.join(__dirname, '../src/ios')
    )
    console.log('download complete ...')
  }

  async extractIosFW() {
    await tar.extract({
      file: path.join(__dirname, '../src/ios/', this.iosFWPackage()),
      cwd: path.join(__dirname, '../src/ios')
    })
  }

  async generate(name, outFile) {
    ejs.renderFile(this.templatePath(name), { plugin: this.config}, function(err, expData){
      fs.writeFileSync(outFile, expData)
    })
  }

  changelogEntry(sdk) {
    if (sdk === 'both') {
      return `Updated ios sdk to ${this.iosSDKVersion} and android SDK to ${this.androidSDKVersion}`
    } else {
      var sdkVersion = ( sdk === 'ios' ? this.iosSDKVersion : this.androidSDKVersion)
      return `Updated ${sdk} SDK to ${sdkVersion}`
    }
  }

  async updateChangelog(sdk) {
    var chEntry = this.changelogEntry(sdk)
    var plgVersion = this.pluginVersion

    const changes = await replace({
      files: path.join(__dirname, '../CHANGELOG.md'),
      from: /---/g,
      to: `---
## [${plgVersion}] - ${moment(new Date()).format('YYYY-MM-DD')}
### Changed
- ${chEntry}
    `,
    })
 
  }
  async rmDownloadedIosFW() {
    var fl = path.join(__dirname, '../src/ios/', this.iosFWPackage())
    await unlink(fl)
  }

  async commitAndTag(sdk) {
    var root = path.join(__dirname, '../')
    await git.add({ dir: root, filepath: 'package.json'})
    await git.add({ dir: root, filepath: 'plugin.xml'})
    await git.add({ dir: root, filepath: 'CHANGELOG.md'})

    if ( (sdk === 'ios') || (sdk === 'both') ){
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Headers/Payabbhi.h'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Info.plist'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Modules/Payabbhi.swiftmodule/arm.swiftmodule'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Modules/Payabbhi.swiftmodule/arm64.swiftmodule'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Modules/Payabbhi.swiftmodule/i386.swiftmodule'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Modules/Payabbhi.swiftmodule/x86_64.swiftmodule'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Payabbhi'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Payabbhi.storyboardc/PayabbhiViewController.nib'})
      await git.add({ dir: root, filepath: 'src/ios/Payabbhi.framework/Payabbhi.storyboardc/q1H-70-XDU-view-mkj-ni-ViG.nib'})
    }

    let sha = await git.commit({
      dir: root,
      message: `Release ${this.pluginVersion}`
    })
    console.log("Created commit", sha)

    await spawn('git', ['tag', '-a', `v${this.pluginVersion}`, '-m', `Version ${this.pluginVersion}`, sha])
  }

  async pushToRemote() {
    var ghToken = this.token
    var brName = this.branchName()

    let pushResponse = await git.push({
      dir: path.join(__dirname, '../'),
      remote: 'origin',
      ref: brName,
      token: ghToken
    })

    await spawn('git', ['push', 'origin', `v${this.pluginVersion}`] )
  }

  async createPR() {
    var ghToken = this.token 
    octokit.authenticate({
      type: 'token',
      token: ghToken
    })

    var organization = this.config.payabbhi.org
    await octokit.pullRequests.create({
      owner: organization, 
      repo: this.config.name, 
      title: `Release ${this.pluginVersion}`, 
      head: this.branchName(),
      base: 'master'
    })
  }

  updateIos(pluginVersion, sdkVersion, xcodeVersion) {
    this.pluginVersion = pluginVersion
    this.iosSDKVersion = sdkVersion
    this.xcodeVersion = xcodeVersion
  }

  updateAndroid(pluginVersion, sdkVersion) {
    this.pluginVersion = pluginVersion
    this.androidSDKVersion = sdkVersion
  }
 
  async build(sdk) {

    await this.createBranch()
    console.log('Created branch', this.branchName())

    await this.updatePkjJson()
    console.log('Updated package.json')

    await this.generate('plugin', this.relPath('../plugin.xml'))
    console.log('generated plugin.xml')

    if ( (sdk === 'ios') || (sdk === 'both') ) {
      await this.removePreviousFW()
      console.log('removed previous ios framework')
      await this.downloadIosFW()
      console.log('Downloaded new ios framework')
      await this.extractIosFW()
      console.log('Extracted new ios framework')
      await this.rmDownloadedIosFW()
      console.log('Deleted downloaded tar.gz of ios framework')
    }

    await this.updateChangelog(sdk)
    console.log('Updated CHANGELOG.md')
    await this.commitAndTag(sdk)
    console.log('Created commit and tag')
    await this.pushToRemote()
    console.log('Pushed branch to remote')
    await this.createPR()
    console.log('Created pull request')
  }
}
 
program
  .command('ios <pluginVersion> <sdkVersion> <xcodeVersion> <ghToken>')
  .description('Create a new release with a new iOS SDK version')
  .action(async function(pluginVersion, sdkVersion, xcodeVersion, ghToken){

    var builder = new Builder(config, ghToken)
    builder.updateIos(pluginVersion, sdkVersion, xcodeVersion)
    await builder.build('ios')
  });

program
  .command('android <pluginVersion> <sdkVersion> <ghToken>')
  .description('Create a new release with a new Android SDK version')
  .action(async function(pluginVersion, sdkVersion, ghToken){

    var builder = new Builder(config, ghToken)
    builder.updateAndroid(pluginVersion, sdkVersion)
    await builder.build('android')

  });

program
  .command('both <pluginVersion> <iosSdkVersion> <xcodeVersion> <androidSdkVersion> <ghToken>')
  .description('Create a new release with new iOS and Android SDK versions')
  .action(async function(pluginVersion, iosSdkVersion, xcodeVersion, androidSdkVersion, ghToken){

    var builder = new Builder(config, ghToken)
    builder.updateIos(pluginVersion, iosSdkVersion, xcodeVersion)
    builder.updateAndroid(pluginVersion, androidSdkVersion)
    await builder.build('both')
  });
 
program.parse(process.argv);
