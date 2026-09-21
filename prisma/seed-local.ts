import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const passwordHash = await bcrypt.hash("changeme123", 10);
  const user = await prisma.fotUser.upsert({
    where: { email: "admin@propertyguru.com.my" },
    update: {},
    create: { email: "admin@propertyguru.com.my", name: "Local FOT Admin", passwordHash },
  });

  const existing = await prisma.product.findFirst({ where: { name: "Meta Ads Campaign (Local Test)" } });
  if (existing) await prisma.product.delete({ where: { id: existing.id } });

  await prisma.product.create({
    data: {
      name: "Meta Ads Campaign (Local Test)", createdById: user.id,
      steps: { create: [
        { title: "Personal Information", titleMs: "Maklumat Peribadi", titleZh: "个人资料", order: 0, fields: { create: [
          { label: "Full Name", labelMs: "Nama Penuh", labelZh: "全名", type: "TEXT", required: true, order: 0 },
          { label: "Agent ID", labelMs: "ID Ejen", labelZh: "经纪人编号", type: "TEXT", required: true, order: 1 },
        ] } },
        { title: "Campaign Details", titleMs: "Butiran Kempen", titleZh: "广告详情", order: 1, fields: { create: [
          { label: "Where would you like to advertise? — Listing / Agent Profile URL", labelMs: "Di manakah anda ingin mengiklankan? — URL Listing / Profil Ejen", labelZh: "您想在哪里投放广告？— 房源 / 经纪人主页链接", type: "URL", required: true, order: 0 },
          { label: "Platform", labelMs: "Platform", labelZh: "平台", type: "DROPDOWN", required: true, order: 1, options: ["Facebook", "Instagram"] },
          { label: "Start Date", labelMs: "Tarikh Mula", labelZh: "开始日期", type: "DATE", required: true, order: 2 },
          { label: "Ad Caption", labelMs: "Kapsyen Iklan", labelZh: "广告文案", type: "TEXTAREA", required: false, maxLength: 500, order: 3 },
        ] } },
        { title: "Materials Submission", titleMs: "Penyerahan Bahan", titleZh: "素材提交", order: 2, fields: { create: [
          { label: "Feed Image", labelMs: "Imej Feed", labelZh: "信息流图片", type: "FILE", required: true, order: 0, minFiles: 1, maxFiles: 1, maxSizeMb: 10, allowedTypes: ["image/jpeg", "image/png"], width: 1080, height: 1080 },
          { label: "Story Image", labelMs: "Imej Story", labelZh: "快拍图片", type: "FILE", required: true, order: 1, minFiles: 1, maxFiles: 1, maxSizeMb: 10, allowedTypes: ["image/jpeg", "image/png"], width: 1080, height: 1920 },
          { label: "Story Video (Optional)", labelMs: "Video Story (Pilihan)", labelZh: "快拍视频（可选）", type: "FILE", required: false, order: 2, minFiles: 1, maxFiles: 1, maxSizeMb: 30, allowedTypes: ["video/mp4"], width: 1080, height: 1920 },
          { label: "Additional Notes", labelMs: "Nota Tambahan", labelZh: "补充说明", type: "TEXTAREA", required: false, maxLength: 500, order: 3 },
        ] } },
      ] },
    },
  });
  console.log("Local FOT user and sample product created.");
}

main().finally(() => prisma.$disconnect());
