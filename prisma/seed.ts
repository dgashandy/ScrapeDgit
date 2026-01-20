import { PrismaClient, UserRole, AuthProvider } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // Create admin user
    const adminPassword = await bcrypt.hash("Admin123!", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@scrapedgit.com" },
        update: {},
        create: {
            email: "admin@scrapedgit.com",
            name: "Admin",
            passwordHash: adminPassword,
            authProvider: AuthProvider.EMAIL,
            role: UserRole.ADMIN,
            isVerified: true,
            location: "Jakarta",
        },
    });

    console.log("✅ Admin user created:", admin.email);

    // Create a demo user
    const demoPassword = await bcrypt.hash("Demo123!", 12);

    const demoUser = await prisma.user.upsert({
        where: { email: "demo@scrapedgit.com" },
        update: {},
        create: {
            email: "demo@scrapedgit.com",
            name: "Demo User",
            passwordHash: demoPassword,
            authProvider: AuthProvider.EMAIL,
            role: UserRole.USER,
            isVerified: true,
            location: "Surabaya",
        },
    });

    console.log("✅ Demo user created:", demoUser.email);

    console.log("🎉 Database seed completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
