const { host } = require("./host.json")

const PROJECT_DATA = {
  hazard_mitigation: { HOST: "http://lhmp.availabs.org", URL: "/password/set", name: "Hazard Mitigation" },
  NPMRDS: { HOST: "http://localhost:3001", URL: "/password/set", name: "NPMRDS" }
}
const DEFAULT_PROJECT_DATA = {
  HOST: host, URL: "/password/set"
}
const getProjectData = (project_name, args) =>
     Object.assign({}, DEFAULT_PROJECT_DATA, PROJECT_DATA[project_name], args)

module.exports = {
  getProjectData
}
