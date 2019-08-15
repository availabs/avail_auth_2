const { host } = require("./host.json")

const PROJECT_DATA = {
  example_project_name: { HOST: "www.fakehost.com", URL: "/fake/url", name: "Pretty Name" }
}
const DEFAULT_PROJECT_DATA = {
  HOST: host, URL: "/password/reset"
}
const getProjectData = (project_name, args) =>
  Object.assign({}, DEFAULT_PROJECT_DATA, PROJECT_DATA[project_name], args)

module.exports = {
  getProjectData
}
