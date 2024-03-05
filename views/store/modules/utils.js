const baseurl = ''

export const postJson = (url, body) =>
	fetch(`${baseurl}${url}`, {
		method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
	})
	.then(r => r.json())