const https = require("https")

const { slack_key } = require("./slack_key")

const post = (url, body) => {
  return new Promise((resolve, reject) => {

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ slack_key }`
      }
    }

    const request = https.request(url, options, res => {
      const { statusCode } = res;
      if (statusCode !== 200) {
        return reject(new Error(`URL ${ url } failed, with: ${ statusCode }`));
      }

      res.on('error', reject);

      const chunks = [];
      res.on('data', chunk => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks.join("")));
        }
        catch (e) {
          reject(e);
        }
      });
    })

    request.on('error', reject);
    request.write(JSON.stringify(body));
    request.end();
  })
}

const slacker = async (sendTo, message) => {
  const body = {
    channel: sendTo,
    text: message
  }
  return post("https://slack.com/api/chat.postMessage", body)
    .then(res => {
      if (!res.ok) {
        throw new Error(res.error);
      }
    });
}

module.exports = slacker;
