const { pool } = require('./db');

const createTables = async () => {
  try {

    // ─────────────────────────────────────────────────────────────────────────
    // 1. USERS (already created in db.js but kept here for reference)
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(100) NOT NULL,
        email           VARCHAR(150) UNIQUE NOT NULL,
        password        VARCHAR(255),
        role            VARCHAR(20) DEFAULT 'student'
                          CHECK (role IN ('student', 'owner', 'admin')),
        google_id       VARCHAR(255) UNIQUE,
        avatar          VARCHAR(500),
        is_verified     BOOLEAN DEFAULT FALSE,
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ users table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PGS — core listing table
    //    Every PG an owner adds goes here
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pgs (
        id                SERIAL PRIMARY KEY,
        owner_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Basic Info
        name              VARCHAR(150) NOT NULL,
        description       TEXT,
        location          VARCHAR(255) NOT NULL,       -- "Whitefield, Bangalore"
        city              VARCHAR(100) NOT NULL,
        latitude          DECIMAL(9,6),               -- for map
        longitude         DECIMAL(9,6),

        -- Pricing
        monthly_rent      INTEGER NOT NULL,            -- in INR
        fair_price_estimate INTEGER,                   -- AI calculated fair price

        -- Room Details
        room_type         VARCHAR(20) DEFAULT 'single'
                            CHECK (room_type IN ('single', 'double', 'triple')),
        total_rooms       INTEGER DEFAULT 1,

        -- Amenities (boolean flags)
        has_wifi          BOOLEAN DEFAULT FALSE,
        has_ac            BOOLEAN DEFAULT FALSE,
        has_meals         BOOLEAN DEFAULT FALSE,
        has_laundry       BOOLEAN DEFAULT FALSE,
        has_parking       BOOLEAN DEFAULT FALSE,
        has_security      BOOLEAN DEFAULT FALSE,
        has_gym           BOOLEAN DEFAULT FALSE,
        has_hot_water     BOOLEAN DEFAULT FALSE,
        has_tv            BOOLEAN DEFAULT FALSE,

        -- Status
        status            VARCHAR(20) DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
        is_active         BOOLEAN DEFAULT TRUE,

        -- AI Scores (updated when reviews come in)
        overall_score     INTEGER DEFAULT 0,          -- 0-100
        hygiene_score     INTEGER DEFAULT 0,
        food_score        INTEGER DEFAULT 0,
        safety_score      INTEGER DEFAULT 0,
        amenities_score   INTEGER DEFAULT 0,
        pricing_score     INTEGER DEFAULT 0,

        -- Stats
        total_views       INTEGER DEFAULT 0,
        total_reviews     INTEGER DEFAULT 0,

        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ pgs table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. PG_IMAGES — photos uploaded by owner for each PG
    //    One PG can have multiple images
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pg_images (
        id            SERIAL PRIMARY KEY,
        pg_id         INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
        image_url     VARCHAR(500) NOT NULL,           -- Cloudinary URL
        is_primary    BOOLEAN DEFAULT FALSE,           -- main cover image
        uploaded_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ pg_images table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PG_CLAIMS — owner's claims about their PG
    //    e.g. "24/7 Hot Water", "Daily Cleaning", "3 Meals/Day"
    //    Later compared against actual reviews (Claim vs Reality feature)
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pg_claims (
        id            SERIAL PRIMARY KEY,
        pg_id         INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
        claim_text    VARCHAR(255) NOT NULL,           -- "24/7 Hot Water"
        avg_rating    DECIMAL(3,1) DEFAULT 0,          -- avg from reviews (0-5)
        match_status  VARCHAR(20) DEFAULT 'unverified'
                        CHECK (match_status IN ('match', 'mismatch', 'unverified')),
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ pg_claims table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. RESIDENCY_VERIFICATIONS — student submits proof they live in a PG
    //    Admin approves → student becomes "verified resident"
    //    Only verified residents can write reviews
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS residency_verifications (
        id              SERIAL PRIMARY KEY,
        student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pg_id           INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
        proof_url       VARCHAR(500) NOT NULL,         -- uploaded document URL
        status          VARCHAR(20) DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by     INTEGER REFERENCES users(id),  -- admin who approved/rejected
        reviewed_at     TIMESTAMP,
        submitted_at    TIMESTAMP DEFAULT NOW(),

        -- A student can only have one active verification per PG
        UNIQUE(student_id, pg_id)
      );
    `);
    console.log('✅ residency_verifications table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. REVIEWS — anonymous reviews by verified residents
    //    Ratings for hygiene, food, safety, amenities (each 1-5)
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id                SERIAL PRIMARY KEY,
        pg_id             INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
        student_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Ratings (1-5 each)
        hygiene_rating    INTEGER CHECK (hygiene_rating BETWEEN 1 AND 5),
        food_rating       INTEGER CHECK (food_rating BETWEEN 1 AND 5),
        safety_rating     INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
        amenities_rating  INTEGER CHECK (amenities_rating BETWEEN 1 AND 5),
        overall_rating    INTEGER CHECK (overall_rating BETWEEN 1 AND 5),

        -- Written review
        review_text       TEXT,

        -- Display as anonymous or verified resident
        is_anonymous      BOOLEAN DEFAULT TRUE,

        -- Admin moderation
        is_flagged        BOOLEAN DEFAULT FALSE,
        is_approved       BOOLEAN DEFAULT TRUE,

        -- Owner reply
        owner_reply       TEXT,
        replied_at        TIMESTAMP,

        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW(),

        -- One review per student per PG
        UNIQUE(student_id, pg_id)
      );
    `);
    console.log('✅ reviews table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. TRANSPARENCY_SCORES — AI calculated scorecard per PG
    //    Updated every time a new review is added
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transparency_scores (
        id                  SERIAL PRIMARY KEY,
        pg_id               INTEGER NOT NULL UNIQUE REFERENCES pgs(id) ON DELETE CASCADE,

        -- Scores (0-100)
        overall_score       INTEGER DEFAULT 0,
        hygiene_score       INTEGER DEFAULT 0,
        food_score          INTEGER DEFAULT 0,
        safety_score        INTEGER DEFAULT 0,
        amenities_score     INTEGER DEFAULT 0,
        pricing_score       INTEGER DEFAULT 0,

        -- Price analysis
        fair_price_estimate INTEGER,                   -- AI estimated fair price
        price_difference    INTEGER,                   -- actual - fair (+ means overpriced)
        price_label         VARCHAR(20) DEFAULT 'fair'
                              CHECK (price_label IN ('fair', 'underpriced', 'overpriced')),

        -- Meta
        total_reviews_used  INTEGER DEFAULT 0,
        last_calculated     TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ transparency_scores table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // 8. SAVED_PGS — student's saved/liked PGs (the ❤️ feature)
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_pgs (
        id          SERIAL PRIMARY KEY,
        student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pg_id       INTEGER NOT NULL REFERENCES pgs(id) ON DELETE CASCADE,
        saved_at    TIMESTAMP DEFAULT NOW(),

        -- Can't save same PG twice
        UNIQUE(student_id, pg_id)
      );
    `);
    console.log('✅ saved_pgs table ready');

    // ─────────────────────────────────────────────────────────────────────────
    // AUTO UPDATE updated_at TRIGGER (for pgs and reviews)
    // ─────────────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ language 'plpgsql';
    `);

    for (const table of ['users', 'pgs', 'reviews']) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('\n🎉 All tables created successfully!');
    console.log('─────────────────────────────────────');
    console.log('Tables ready: users, pgs, pg_images, pg_claims,');
    console.log('residency_verifications, reviews, transparency_scores, saved_pgs');

  } catch (err) {
    console.error('❌ Schema error:', err.message);
    throw err;
  }
};

module.exports = { createTables };