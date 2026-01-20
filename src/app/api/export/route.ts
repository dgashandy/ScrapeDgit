import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";
import { ScoredProduct } from "@/lib/types";

const exportSchema = z.object({
    products: z.array(z.object({
        rank: z.number(),
        name: z.string(),
        price: z.number(),
        rating: z.number(),
        soldCount: z.number(),
        sellerLocation: z.string(),
        source: z.string(),
        finalScore: z.number(),
        estimatedShipping: z.number().optional(),
        productLink: z.string(),
    })),
    format: z.enum(["xlsx", "csv"]),
    filename: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = exportSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { products, format, filename } = validation.data;

        // Prepare data for export
        const exportData = products.map((product) => ({
            Rank: product.rank,
            "Product Name": product.name,
            Price: `Rp ${product.price.toLocaleString("id-ID")}`,
            Rating: product.rating.toFixed(1),
            "Times Bought": product.soldCount.toLocaleString("id-ID"),
            Location: product.sellerLocation,
            "Est. Shipping": product.estimatedShipping
                ? `Rp ${product.estimatedShipping.toLocaleString("id-ID")}`
                : "N/A",
            Source: product.source.charAt(0).toUpperCase() + product.source.slice(1),
            "Final Score": product.finalScore.toFixed(2),
            "Product Link": product.productLink,
        }));

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

        // Set column widths
        worksheet["!cols"] = [
            { wch: 6 },   // Rank
            { wch: 50 },  // Product Name
            { wch: 15 },  // Price
            { wch: 8 },   // Rating
            { wch: 14 },  // Times Bought
            { wch: 15 },  // Location
            { wch: 15 },  // Est. Shipping
            { wch: 12 },  // Source
            { wch: 12 },  // Final Score
            { wch: 60 },  // Product Link
        ];

        const baseFilename = filename || `scrapedgit-results-${Date.now()}`;

        if (format === "csv") {
            const csvData = XLSX.utils.sheet_to_csv(worksheet);

            return new NextResponse(csvData, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${baseFilename}.csv"`,
                },
            });
        } else {
            const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

            return new NextResponse(xlsxBuffer, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${baseFilename}.xlsx"`,
                },
            });
        }
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to export data" },
            { status: 500 }
        );
    }
}
