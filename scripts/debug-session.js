const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sessionId = process.argv[2] || 'cmkmka8c5004vxan3ggho0bya';

async function main() {
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!session) {
        console.log('Session not found:', sessionId);
        return;
    }

    console.log('\n=== SESSION ===');
    console.log('ID:', session.id);
    console.log('Title:', session.title);
    console.log('Accumulated Query:', JSON.stringify(session.accumulatedQuery, null, 2));

    console.log('\n=== MESSAGES ===');
    for (const msg of session.messages) {
        console.log(`\n[${msg.role}]: ${msg.content.substring(0, 150)}...`);
        if (msg.parsedQuery) {
            console.log('Parsed Query:', JSON.stringify(msg.parsedQuery, null, 2));
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
