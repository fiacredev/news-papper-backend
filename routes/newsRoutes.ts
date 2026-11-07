import { NextResponse } from "next/server";
import Article from "../models/article.model.js";

export async function getNewsHandler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const slug = searchParams.get("slug");
    const limit = Number(searchParams.get("limit") || 20);

    const filter: Record<string, unknown> = {
      status: "published",
    };

    if (category) {
      filter.category = category.toLowerCase();
    }

    if (slug) {
      filter.slug = slug;
    }

    const articles = await Article.find(filter)
      .populate("author", "name email avatar")
      .sort({ publishedAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 100))
      .lean();

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("Get news error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to retrieve news" },
      { status: 500 }
    );
  }
}

export async function createNewsHandler(req: Request) {
  try {
    const body = await req.json();

    const requiredFields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "category",
      "author",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Authentication and authorization must be enforced
    // before allowing this handler to create articles.
    return NextResponse.json(
      {
        success: false,
        message: "Article creation requires authenticated admin or journalist authorization.",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Create news error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to process article" },
      { status: 500 }
    );
  }
}

export async function deleteNewsHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Article ID is required" },
        { status: 400 }
      );
    }

    // Authentication and authorization must be enforced
    // before allowing articles to be deleted.
    return NextResponse.json(
      {
        success: false,
        message: "Article deletion requires authenticated admin authorization.",
      },
      { status: 401 }
    );

  } catch (error) {
    console.error("Delete news error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete article" },
      { status: 500 }
    );
  }
}