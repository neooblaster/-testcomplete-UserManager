const UserManager = require('UserManager');

function logon() {
  //-------------------------------------------------------------
  // Only for test purpose : getting 3 session in same exection
  ProjectSuite.Variables.sUsers = '{}';
  //-------------------------------------------------------------

  let UserMgr = new UserManager()
                    .setLockFolderLocation('./Locks')
                    .setUserCatalogueLocation('./catalogue.json')
                    .getUserSessionGroup();
                    
  Log.message(`SAP user from session : ${UserMgr.saplogon().user()}`);
  Log.message(`Fiori user from session : ${UserMgr.fiori().user()}`);
  Log.message(`Supplier user from session : ${UserMgr.supplier().user()}`);
}