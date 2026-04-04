"use server";

import { transporter } from "@/lib/nodemailer";

export async function submitRegionWaitlist(input: {
  country: string;
  state: string;
  city: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const country = input.country?.trim();
  const state = input.state?.trim();
  const city = input.city?.trim();

  if (!country || !city) {
    return { ok: false, error: "Please choose a country and city." };
  }

  const lines = [
    "New region waitlist request (Next Voters)",
    "",
    `Country: ${country}`,
    `State / province: ${state || "—"}`,
    `City: ${city}`,
  ];

  const user = process.env.EMAIL_USER;
  if (!user) {
    return { ok: false, error: "Email is not configured on the server." };
  }

  try {
    await transporter.sendMail({
      from: `Next Voters <${user}>`,
      to: user,
      subject: `[Next Voters] Region request: ${city}, ${country}`,
      text: lines.join("\n"),
      html: `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">${lines
        .map((l) => (l === "" ? "<br/>" : l))
        .join("<br/>")}</pre>`,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send";
    return { ok: false, error: message };
  }
}
