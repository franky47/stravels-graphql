export const getActivities = async userId => {
  const fileName = `./${userId}.json`
  return require(fileName)
}

export default {
  getActivities
}
