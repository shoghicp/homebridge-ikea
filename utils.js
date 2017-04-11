var execSync = require('child_process').execSync

const coap = (method, config) => `coap-client -u "Client_identity" -k "${config.psk}" -m ${method} coaps://${config.ip}:5684/15001/`

const put = config => coap("put", config)
const get = config => coap("get", config)

module.exports.setBrightness = (config, id, brightness, callback) => {
  console.log(`Setting brightness of ${brightness} for ${id}`)
  var cmd = `echo '{ "3311" : [{ "5851" : ${brightness}} ] }' | ${put(config)}${id} -f -`
  console.log(cmd)
  callback(execSync(cmd, {encoding: "utf8"}))
}

module.exports.setKelvin = (config, id, kelvin, callback) => {

  let colorX, colorY

  switch(true) {
    // Cold light
    case (kelvin < 2700):
      colorX = 24930
      colorY = 24694
      break;

    case (kelvin < 4000):
      colorX = 30140
      colorY = 26909
      break;

    // Warm light
    default:
      colorX = 33135
      colorY = 27211
      break;
  }

  console.log("Kelvin: %s, colorX: %s, colorY: %s", kelvin, colorX, colorY)

  console.log(`Setting kelvin of ${kelvin} for ${id}`)
  var cmd = `echo '{ "3311" : [{ "5709": ${colorX} , "5710": ${colorY} }] }' | ${put(config)}${id} -f -`
  console.log(cmd)
  callback(execSync(cmd, {encoding: "utf8"}))
}

// @TODO: Figure out if the gateway actually don't support this
module.exports.setOnOff = (config, id, state, callback) => {
  var cmd = `echo '{ "3311" : [{ "5580" : ${state}} ] }' | ${put(config)}${id} -f -`
  console.log(cmd)
  callback(execSync(cmd, {encoding: "utf8"}))
}

const parseDeviceList = str => {
  const split = str.trim().split("\n")
  return split.pop().slice(1,-1).split(",")
}

module.exports.getDevices = config => new Promise((resolve, reject) => {
  var cmd = get(config)
  console.log(cmd)

  resolve(parseDeviceList(execSync(cmd, {encoding: "utf8"})))
})

const parseDevice = str => {
  const split = str.trim().split("\n")
  const json = JSON.parse(split.pop())

  return {
    name: json["9001"],
    type: json["5750"],
    createdAt: json["9002"],
    instanceId: json["9003"],
    details: json["3"],
    reachabilityState: json["9019"],
    lastSeen: json["9020"],
    otaUpdateState: json["9054"],
    switch: json["15009"],
    light: json["3311"]
  }

  /*
    light: {
    {
       onoff: json["3311"]["5580"],
       dimmer: json["3311"]["5851"],
       color_x: json["3311"]["5709"],
       color_y: json["3311"]["5710"],
       color: json["3311"]["5706"],
       instance_id: json["3311"]["9003"],
       "5707":0,
       "5708":0,
       "5711":0,
      }
    }
  */
}

module.exports.getDevice = (config, id) => new Promise((resolve, reject) => {
  console.log(`Get device information for: ${id}`)
  var cmd = get(config) + id
  console.log(cmd)

  resolve(parseDevice(execSync(cmd, {encoding: "utf8"})))

})
