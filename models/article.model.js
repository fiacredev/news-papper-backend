
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Reusable image structure
const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },

    publicId: {
      type: String,
      required: true,
      trim: true
    },

    altText: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false
  }
);

// SEO information
const seoSchema = new Schema(
  {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 70
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    }
  },
  {
    _id: false
  }
);

// Main article schema
const articleSchema = new Schema(
  {
    // Article headline
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      minlength: 5,
      maxlength: 200
    },

    // SEO-friendly URL identifier
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Short article summary
    excerpt: {
      type: String,
      required: [true, "Article excerpt is required"],
      trim: true,
      maxlength: 500
    },

    // Rich text editor HTML content
    content: {
      type: String,
      required: [true, "Article content is required"]
    },

    // Main article image
    featuredImage: {
      type: imageSchema,
      default: null
    },

    // Additional article images
    images: {
      type: [imageSchema],
      default: []
    },

    // Article category
    category: {
      type: String,
      required: true,
      lowercase: true,
      enum: [
        "general",
        "politics",
        "sports",
        "business",
        "technology",
        "health",
        "science",
        "entertainment"
      ]
    },

    // Article keywords
    tags: {
      type: [String],
      default: []
    },

    // Journalist or administrator who created the article
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Editorial publishing status
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true
    },

    // Article origin
    source: {
      type: String,
      enum: ["original", "external"],
      default: "original"
    },

    // Original publisher URL for external articles
    sourceUrl: {
      type: String,
      trim: true,
      default: null
    },

    // Publication date
    publishedAt: {
      type: Date,
      default: null
    },

    // Featured article
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    // Article reading statistics
    views: {
      type: Number,
      default: 0,
      min: 0
    },


    // SEO metadata
    seo: {
      type: seoSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "articles"
  }
);

// Database indexes
articleSchema.index({ slug: 1 }, { unique: true });

articleSchema.index({
  status: 1,
  category: 1,
  publishedAt: -1
});

articleSchema.index({
  author: 1,
  createdAt: -1
});

articleSchema.index({
  title: "text",
  excerpt: "text"
});

// Export Article model
const Article = model("Article", articleSchema);

export default Article;
