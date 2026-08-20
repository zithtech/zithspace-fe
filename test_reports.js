const axios = require("axios");

async function test() {
  try {
    const res = await axios.get("http://localhost:3000/api/sprint-reports?projectId=3795d013-ece7-49de-bb2d-e3d2199b9a27&page=1&limit=20", {
      headers: {
        Cookie: "tenantId=some-tenant", // This won't work perfectly without real token
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
