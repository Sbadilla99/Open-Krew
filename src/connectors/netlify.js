// src/connectors/netlify.js
import JSZip from "jszip";

const NETLIFY_API = "https://api.netlify.com/api/v1";

// Headers file forces Netlify to serve HTML correctly
const NETLIFY_HEADERS = `/*
  Content-Type: text/html; charset=utf-8
  X-Frame-Options: SAMEORIGIN
`;

async function makeZip(html) {
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("_headers", NETLIFY_HEADERS);
  return await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

async function waitForDeploy(token, deployId, maxWait = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(`${NETLIFY_API}/deploys/${deployId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const deploy = await res.json();
      if (deploy.state === "ready" || deploy.state === "current") {
        const url = deploy.ssl_url || deploy.url;
        return url.startsWith("http") ? url : `https://${url}`;
      }
      if (deploy.state === "error") return null;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

export const netlifyConnector = {
  id: "netlify",
  name: "Netlify",
  emoji: "🌐",
  color: "#00C7B7",
  role: "Deployment",
  type: "executor",

  isConfigured() {
    return !!process.env.NETLIFY_TOKEN;
  },

  async deployHTML(html, siteName = null) {
    if (!this.isConfigured()) {
      return { success: false, error: "NETLIFY_TOKEN not configured. Get yours at app.netlify.com/user/applications" };
    }
    try {
      const token = process.env.NETLIFY_TOKEN;
      const name = siteName || `openkrew-${Date.now()}`;
      const zipBuffer = await makeZip(html);

      // Create site
      const siteRes = await fetch(`${NETLIFY_API}/sites`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!siteRes.ok) {
        if (siteRes.status === 422) {
          return this.deployHTML(html, `openkrew-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
        }
        return { success: false, error: `Failed to create site: ${await siteRes.text()}` };
      }

      const site = await siteRes.json();

      // Deploy ZIP
      const deployRes = await fetch(`${NETLIFY_API}/sites/${site.id}/deploys`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/zip" },
        body: zipBuffer,
      });

      if (!deployRes.ok) {
        return { success: false, error: `Deploy failed: ${await deployRes.text()}` };
      }

      const deploy = await deployRes.json();
      const finalUrl = await waitForDeploy(token, deploy.id);

      return {
        success: true,
        url: finalUrl || `https://${site.name}.netlify.app`,
        siteId: site.id,
        deployId: deploy.id,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateSite(siteId, html) {
    if (!this.isConfigured()) {
      return { success: false, error: "NETLIFY_TOKEN not configured" };
    }
    try {
      const token = process.env.NETLIFY_TOKEN;
      const zipBuffer = await makeZip(html);

      const deployRes = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/zip" },
        body: zipBuffer,
      });

      if (!deployRes.ok) {
        return { success: false, error: `Update failed: ${await deployRes.text()}` };
      }

      const deploy = await deployRes.json();
      const finalUrl = await waitForDeploy(token, deploy.id);
      return { success: true, url: finalUrl, deployId: deploy.id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
