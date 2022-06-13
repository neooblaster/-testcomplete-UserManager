const UserManager = require('UserManager');

function release() {
  let UserMgr = new UserManager()
                    .setLockFolderLocation('./Locks')
                    .setUserCatalogueLocation('./catalogue.json')
                    .getUserSessionGroup()     // << Will retrieve session using lock file to...
                    .releaseUserSessionGroup() // << ...delete locks files
}