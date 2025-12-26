SET search_path TO oriontour, public;

CREATE TABLE IF NOT EXISTS country (
  id               BIGSERIAL PRIMARY KEY,
  name_ru          TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  iso_code         CHAR(2) NOT NULL UNIQUE,
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  flag_url         TEXT,
  is_popular       BOOLEAN NOT NULL DEFAULT FALSE,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS region (
  id         BIGSERIAL PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES country(id) ON DELETE CASCADE,
  name_ru    TEXT NOT NULL,
  name_en    TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_id, name_ru)
);

CREATE TABLE IF NOT EXISTS resort (
  id         BIGSERIAL PRIMARY KEY,
  country_id BIGINT NOT NULL REFERENCES country(id) ON DELETE CASCADE,
  region_id  BIGINT REFERENCES region(id) ON DELETE SET NULL,
  name_ru    TEXT NOT NULL,
  name_en    TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_id, name_ru)
);

CREATE INDEX IF NOT EXISTS idx_region_country ON region(country_id);
CREATE INDEX IF NOT EXISTS idx_resort_country ON resort(country_id);
CREATE INDEX IF NOT EXISTS idx_resort_region  ON resort(region_id);

CREATE TABLE IF NOT EXISTS departure_city (
  id         BIGSERIAL PRIMARY KEY,
  name_ru    TEXT NOT NULL,
  name_en    TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name_ru)
);

CREATE TABLE IF NOT EXISTS meal_plan (
  id      BIGSERIAL PRIMARY KEY,
  code    TEXT NOT NULL UNIQUE,
  name_ru TEXT NOT NULL,
  name_en TEXT
);

CREATE TABLE IF NOT EXISTS currency (
  code    CHAR(3) PRIMARY KEY,   
  name_ru TEXT NOT NULL,
  symbol  TEXT
);

CREATE TABLE IF NOT EXISTS hotel (
  id          BIGSERIAL PRIMARY KEY,
  country_id  BIGINT NOT NULL REFERENCES country(id) ON DELETE CASCADE,
  resort_id   BIGINT REFERENCES resort(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  stars       SMALLINT CHECK (stars BETWEEN 1 AND 5),
  address     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS hotel_image (
  id         BIGSERIAL PRIMARY KEY,
  hotel_id   BIGINT NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hotel_image UNIQUE (hotel_id, url)
);

CREATE INDEX IF NOT EXISTS idx_hotel_country     ON hotel(country_id);
CREATE INDEX IF NOT EXISTS idx_hotel_resort      ON hotel(resort_id);
CREATE INDEX IF NOT EXISTS idx_hotel_image_hotel ON hotel_image(hotel_id);

CREATE TABLE IF NOT EXISTS tour (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  short_desc TEXT,
  country_id BIGINT NOT NULL REFERENCES country(id) ON DELETE CASCADE,
  image_url  TEXT,
  is_hot     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tour_country ON tour(country_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tour_title_country
  ON tour (title, country_id);

CREATE TABLE IF NOT EXISTS tour_offer (
  id                 BIGSERIAL PRIMARY KEY,
  tour_id            BIGINT REFERENCES tour(id) ON DELETE SET NULL,
  hotel_id           BIGINT NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  departure_city_id  BIGINT NOT NULL REFERENCES departure_city(id) ON DELETE RESTRICT,

  start_date         DATE NOT NULL,
  nights             SMALLINT NOT NULL CHECK (nights BETWEEN 1 AND 60),
  meal_plan_id       BIGINT REFERENCES meal_plan(id) ON DELETE SET NULL,

  price              NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency_code      CHAR(3) NOT NULL REFERENCES currency(code),

  includes_flight    BOOLEAN NOT NULL DEFAULT TRUE,
  is_available       BOOLEAN NOT NULL DEFAULT TRUE,
  available_seats    INTEGER,

  hotel_stars_cached SMALLINT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_offer_key UNIQUE
    (hotel_id, departure_city_id, start_date, nights, meal_plan_id, includes_flight, currency_code)
);

COMMENT ON TABLE tour_offer IS
'Конкретное предложение: отель + вылет + дата + ночи + питание + цена + наличие (главная таблица для фильтров/поиска).';

CREATE INDEX IF NOT EXISTS idx_offer_filter_main ON tour_offer(departure_city_id, start_date, nights, includes_flight, is_available);
CREATE INDEX IF NOT EXISTS idx_offer_hotel        ON tour_offer(hotel_id);
CREATE INDEX IF NOT EXISTS idx_offer_meal         ON tour_offer(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_offer_price        ON tour_offer(price);
CREATE INDEX IF NOT EXISTS idx_offer_currency     ON tour_offer(currency_code);

CREATE TABLE IF NOT EXISTS review (
  id          BIGSERIAL PRIMARY KEY,
  hotel_id    BIGINT NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  author_name TEXT,
  rating      NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 0 AND 5),
  text        TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_hotel ON review(hotel_id);

CREATE TABLE IF NOT EXISTS review_image (
  id         BIGSERIAL PRIMARY KEY,
  review_id  BIGINT NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_image UNIQUE (review_id, url)
);

CREATE TABLE IF NOT EXISTS contact_message (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT,
  phone      TEXT,
  email      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','closed'))
);

CREATE OR REPLACE VIEW globe_markers AS
SELECT
  c.id, c.name_ru, c.name_en, c.iso_code, c.lat, c.lng, c.flag_url,
  c.is_popular, c.popularity_score,
  COALESCE(COUNT(DISTINCT h.id), 0) AS hotels_count,
  COALESCE(COUNT(o.id), 0) AS offers_count
FROM country c
LEFT JOIN hotel h ON h.country_id = c.id
LEFT JOIN tour_offer o ON o.hotel_id = h.id
GROUP BY
  c.id, c.name_ru, c.name_en, c.iso_code, c.lat, c.lng, c.flag_url,
  c.is_popular, c.popularity_score;

CREATE OR REPLACE VIEW hotel_listing AS
SELECT
  h.id AS hotel_id,
  h.name,
  h.stars,
  h.country_id,
  h.resort_id,
  MIN(o.price) AS price_from,
  (
    SELECT hi.url
    FROM hotel_image hi
    WHERE hi.hotel_id = h.id
    ORDER BY hi.sort_order, hi.id
    LIMIT 1
  ) AS preview_image_url,
  COALESCE(AVG(r.rating), 0) AS rating_avg,
  COUNT(r.id) AS reviews_count,
  COUNT(o.id) AS offers_count
FROM hotel h
LEFT JOIN tour_offer o ON o.hotel_id = h.id AND o.is_available = TRUE
LEFT JOIN review r ON r.hotel_id = h.id
GROUP BY h.id;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_country_updated') THEN
    CREATE TRIGGER tr_country_updated
    BEFORE UPDATE ON country
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_region_updated') THEN
    CREATE TRIGGER tr_region_updated
    BEFORE UPDATE ON region
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_resort_updated') THEN
    CREATE TRIGGER tr_resort_updated
    BEFORE UPDATE ON resort
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_departure_city_updated') THEN
    CREATE TRIGGER tr_departure_city_updated
    BEFORE UPDATE ON departure_city
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_hotel_updated') THEN
    CREATE TRIGGER tr_hotel_updated
    BEFORE UPDATE ON hotel
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_tour_updated') THEN
    CREATE TRIGGER tr_tour_updated
    BEFORE UPDATE ON tour
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_offer_updated') THEN
    CREATE TRIGGER tr_offer_updated
    BEFORE UPDATE ON tour_offer
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

INSERT INTO currency(code, name_ru, symbol)
VALUES
  ('RUB','Российский рубль','₽'),
  ('USD','Доллар США','$'),
  ('EUR','Евро','€')
ON CONFLICT (code) DO NOTHING;

INSERT INTO meal_plan(code, name_ru, name_en)
VALUES
  ('RO','Только проживание','Room Only'),
  ('BB','Завтраки','Bed & Breakfast'),
  ('HB','Полупансион','Half Board'),
  ('FB','Полный пансион','Full Board'),
  ('AI','Всё включено','All Inclusive'),
  ('UAI','Ультра всё включено','Ultra All Inclusive')
ON CONFLICT (code) DO NOTHING;

INSERT INTO country (name_ru, name_en, iso_code, lat, lng, flag_url, is_popular, popularity_score)
VALUES
  ('Турция', 'Turkey', 'TR', 38.9637, 35.2433, 'https://flagcdn.com/w80/tr.png', TRUE, 100),
  ('Египет', 'Egypt', 'EG', 26.8206, 30.8025, 'https://flagcdn.com/w80/eg.png', TRUE, 90),
  ('ОАЭ', 'United Arab Emirates', 'AE', 23.4241, 53.8478, 'https://flagcdn.com/w80/ae.png', TRUE, 70),
  ('Таиланд', 'Thailand', 'TH', 15.8700, 100.9925, 'https://flagcdn.com/w80/th.png', TRUE, 65),
  ('Вьетнам', 'Vietnam', 'VN', 14.0583, 108.2772, 'https://flagcdn.com/w80/vn.png', TRUE, 60),
  ('Испания', 'Spain', 'ES', 40.4637, -3.7492, 'https://flagcdn.com/w80/es.png', TRUE, 75),
  ('Италия', 'Italy', 'IT', 41.8719, 12.5674, 'https://flagcdn.com/w80/it.png', TRUE, 80)
ON CONFLICT (iso_code) DO NOTHING;

INSERT INTO departure_city (name_ru, name_en, lat, lng)
VALUES
  ('Москва', 'Moscow', 55.7558, 37.6173),
  ('Санкт-Петербург', 'Saint Petersburg', 59.9311, 30.3609),
  ('Казань', 'Kazan', 55.7961, 49.1064),
  ('Екатеринбург', 'Yekaterinburg', 56.8389, 60.6057)
ON CONFLICT (name_ru) DO UPDATE
SET name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='TR'),
reg AS (
  INSERT INTO region(country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Анталия', 'Antalya', 36.8969, 30.7133 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE SET name_en=EXCLUDED.name_en, lat=EXCLUDED.lat, lng=EXCLUDED.lng
  RETURNING id AS region_id, country_id
)
INSERT INTO resort(country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Кемер','Kemer',36.6028,30.5598),
  ('Сиде','Side',36.7667,31.3889),
  ('Аланья','Alanya',36.5444,31.9954),
  ('Белек','Belek',36.8625,31.0556)
) v(name_ru,name_en,lat,lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id=EXCLUDED.region_id, name_en=EXCLUDED.name_en, lat=EXCLUDED.lat, lng=EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='EG'),
reg AS (
  INSERT INTO region(country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Красное море', 'Red Sea', 26.8206, 30.8025 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE SET name_en=EXCLUDED.name_en
  RETURNING id AS region_id, country_id
)
INSERT INTO resort(country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Хургада','Hurghada',27.2579,33.8116),
  ('Шарм-эль-Шейх','Sharm El Sheikh',27.9158,34.3290),
  ('Марса-Алам','Marsa Alam',25.0684,34.8796)
) v(name_ru,name_en,lat,lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id=EXCLUDED.region_id, name_en=EXCLUDED.name_en, lat=EXCLUDED.lat, lng=EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='AE'),
reg AS (
  INSERT INTO region(country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Эмираты', 'Emirates', 23.4241, 53.8478 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE SET name_en=EXCLUDED.name_en
  RETURNING id AS region_id, country_id
)
INSERT INTO resort(country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Дубай','Dubai',25.2048,55.2708),
  ('Абу-Даби','Abu Dhabi',24.4539,54.3773),
  ('Шарджа','Sharjah',25.3463,55.4209)
) v(name_ru,name_en,lat,lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id=EXCLUDED.region_id, name_en=EXCLUDED.name_en, lat=EXCLUDED.lat, lng=EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='TH'),
reg AS (
  INSERT INTO region(country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Юг', 'South', 7.8804, 98.3923 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE SET name_en=EXCLUDED.name_en
  RETURNING id AS region_id, country_id
)
INSERT INTO resort(country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Пхукет','Phuket',7.8804,98.3923),
  ('Краби','Krabi',8.0863,98.9063),
  ('Самуи','Koh Samui',9.5120,100.0136)
) v(name_ru,name_en,lat,lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id=EXCLUDED.region_id, name_en=EXCLUDED.name_en, lat=EXCLUDED.lat, lng=EXCLUDED.lng;

WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='VN'),
reg AS (
  INSERT INTO region (country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Нячанг', 'Nha Trang', 12.2388, 109.1967 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE
    SET name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng
  RETURNING id AS region_id, country_id
)
INSERT INTO resort (country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Нячанг',   'Nha Trang',  12.2388, 109.1967),
  ('Камрань',  'Cam Ranh',   11.9986, 109.2190),
  ('Далат',    'Da Lat',     11.9404, 108.4583)
) v(name_ru, name_en, lat, lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id = EXCLUDED.region_id, name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='ES'),
reg AS (
  INSERT INTO region (country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Коста-дель-Соль', 'Costa del Sol', 36.5099, -4.8864 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE
    SET name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng
  RETURNING id AS region_id, country_id
)
INSERT INTO resort (country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Марбелья',   'Marbella',   36.5101, -4.8824),
  ('Малага',     'Malaga',     36.7213, -4.4214),
  ('Торремолинос','Torremolinos',36.6218, -4.5000)
) v(name_ru, name_en, lat, lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id = EXCLUDED.region_id, name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng;


WITH c AS (SELECT id AS country_id FROM country WHERE iso_code='IT'),
reg AS (
  INSERT INTO region (country_id, name_ru, name_en, lat, lng)
  SELECT country_id, 'Адриатика', 'Adriatic', 44.0678, 12.5695 FROM c
  ON CONFLICT (country_id, name_ru) DO UPDATE
    SET name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng
  RETURNING id AS region_id, country_id
)
INSERT INTO resort (country_id, region_id, name_ru, name_en, lat, lng)
SELECT reg.country_id, reg.region_id, v.name_ru, v.name_en, v.lat, v.lng
FROM reg
JOIN (VALUES
  ('Римини',      'Rimini',      44.0678, 12.5695),
  ('Риччоне',     'Riccione',    43.9996, 12.6561),
  ('Чезенатико',  'Cesenatico',  44.1995, 12.3952)
) v(name_ru, name_en, lat, lng) ON TRUE
ON CONFLICT (country_id, name_ru) DO UPDATE
SET region_id = EXCLUDED.region_id, name_en = EXCLUDED.name_en, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

INSERT INTO tour (title, short_desc, country_id, image_url, is_hot)
VALUES
  ('Турция: Анталия 7 ночей', 'Море, пляжи, AI, перелёт + трансфер.', (SELECT id FROM country WHERE iso_code='TR'),
   'https://picsum.photos/seed/turkey/900/500', TRUE),

  ('Египет: Хургада 7 ночей', 'Красное море и кораллы. Перелёт включён.', (SELECT id FROM country WHERE iso_code='EG'),
   'https://picsum.photos/seed/egypt/900/500', TRUE),

  ('ОАЭ: Дубай 5 ночей', 'Город будущего, пляж и шопинг.', (SELECT id FROM country WHERE iso_code='AE'),
   'https://picsum.photos/seed/uae/900/500', FALSE),

  ('Таиланд: Пхукет 10 ночей', 'Островной отдых, пляжи и экскурсии.', (SELECT id FROM country WHERE iso_code='TH'),
   'https://picsum.photos/seed/thai/900/500', FALSE),

  ('Вьетнам: Нячанг 10 ночей', 'Пляжи, острова и уличная еда.', (SELECT id FROM country WHERE iso_code='VN'),
   'https://picsum.photos/seed/vn/900/500', TRUE),

  ('Испания: Коста-дель-Соль 7 ночей', 'Солнце Андалусии, пляжи и тапас.', (SELECT id FROM country WHERE iso_code='ES'),
   'https://picsum.photos/seed/es/900/500', FALSE),

  ('Италия: Римини 7 ночей', 'Адриатика и итальянская кухня.', (SELECT id FROM country WHERE iso_code='IT'),
   'https://picsum.photos/seed/it/900/500', FALSE)
ON CONFLICT (title, country_id) DO UPDATE
SET short_desc = EXCLUDED.short_desc,
    image_url  = EXCLUDED.image_url,
    is_hot     = EXCLUDED.is_hot;

INSERT INTO hotel (country_id, resort_id, name, stars, address, lat, lng, description)
VALUES
  ((SELECT id FROM country WHERE iso_code='TR'),
   (SELECT id FROM resort WHERE name_ru='Кемер' AND country_id=(SELECT id FROM country WHERE iso_code='TR') LIMIT 1),
   'Kemer Orion Resort', 5, 'Kemer', 36.6050, 30.5600, 'Тестовый 5* отель в Кемере.'),

  ((SELECT id FROM country WHERE iso_code='EG'),
   (SELECT id FROM resort WHERE name_ru='Хургада' AND country_id=(SELECT id FROM country WHERE iso_code='EG') LIMIT 1),
   'Hurghada Coral Hotel', 4, 'Hurghada', 27.2600, 33.8120, 'Тестовый 4* отель в Хургаде.'),

  ((SELECT id FROM country WHERE iso_code='AE'),
   (SELECT id FROM resort WHERE name_ru='Дубай' AND country_id=(SELECT id FROM country WHERE iso_code='AE') LIMIT 1),
   'Dubai Marina View', 5, 'Dubai Marina', 25.0800, 55.1400, 'Тестовый 5* отель в Дубае.'),

  ((SELECT id FROM country WHERE iso_code='TH'),
   (SELECT id FROM resort WHERE name_ru='Пхукет' AND country_id=(SELECT id FROM country WHERE iso_code='TH') LIMIT 1),
   'Phuket Ocean Breeze', 4, 'Phuket', 7.9000, 98.3000, 'Тестовый 4* отель на Пхукете.'),

  ((SELECT id FROM country WHERE iso_code='VN'),
   (SELECT id FROM resort WHERE name_ru='Нячанг' AND country_id=(SELECT id FROM country WHERE iso_code='VN') LIMIT 1),
   'Nha Trang Bay Resort', 4, 'Nha Trang', 12.2400, 109.2000, 'Тестовый 4* отель в Нячанге.'),

  ((SELECT id FROM country WHERE iso_code='ES'),
   (SELECT id FROM resort WHERE name_ru='Марбелья' AND country_id=(SELECT id FROM country WHERE iso_code='ES') LIMIT 1),
   'Marbella Sun Hotel', 5, 'Marbella', 36.5105, -4.8830, 'Тестовый 5* отель в Марбелье.'),

  ((SELECT id FROM country WHERE iso_code='IT'),
   (SELECT id FROM resort WHERE name_ru='Римини' AND country_id=(SELECT id FROM country WHERE iso_code='IT') LIMIT 1),
   'Rimini Adriatic Park', 4, 'Rimini', 44.0700, 12.5700, 'Тестовый 4* отель в Римини.')
ON CONFLICT (country_id, name) DO UPDATE
SET resort_id   = EXCLUDED.resort_id,
    stars      = EXCLUDED.stars,
    address    = EXCLUDED.address,
    lat        = EXCLUDED.lat,
    lng        = EXCLUDED.lng,
    description= EXCLUDED.description;

INSERT INTO hotel_image (hotel_id, url, sort_order)
SELECT h.id, v.url, v.sort_order
FROM hotel h
JOIN (VALUES
  ('Kemer Orion Resort',     'https://picsum.photos/seed/kemer1/800/500', 0),
  ('Kemer Orion Resort',     'https://picsum.photos/seed/kemer2/800/500', 1),

  ('Hurghada Coral Hotel',   'https://picsum.photos/seed/hurg1/800/500', 0),
  ('Hurghada Coral Hotel',   'https://picsum.photos/seed/hurg2/800/500', 1),

  ('Dubai Marina View',      'https://picsum.photos/seed/dub1/800/500', 0),
  ('Dubai Marina View',      'https://picsum.photos/seed/dub2/800/500', 1),

  ('Phuket Ocean Breeze',    'https://picsum.photos/seed/phu1/800/500', 0),
  ('Phuket Ocean Breeze',    'https://picsum.photos/seed/phu2/800/500', 1),

  ('Nha Trang Bay Resort',   'https://picsum.photos/seed/nt1/800/500', 0),
  ('Nha Trang Bay Resort',   'https://picsum.photos/seed/nt2/800/500', 1),

  ('Marbella Sun Hotel',     'https://picsum.photos/seed/mar1/800/500', 0),
  ('Marbella Sun Hotel',     'https://picsum.photos/seed/mar2/800/500', 1),

  ('Rimini Adriatic Park',   'https://picsum.photos/seed/rim1/800/500', 0),
  ('Rimini Adriatic Park',   'https://picsum.photos/seed/rim2/800/500', 1)
) v(hotel_name, url, sort_order)
ON v.hotel_name = h.name
ON CONFLICT (hotel_id, url) DO NOTHING;

WITH dep_msk AS (SELECT id AS dc_id FROM departure_city WHERE name_ru='Москва' LIMIT 1),
     dep_spb AS (SELECT id AS dc_id FROM departure_city WHERE name_ru='Санкт-Петербург' LIMIT 1),
     dep_kzn AS (SELECT id AS dc_id FROM departure_city WHERE name_ru='Казань' LIMIT 1),
     mp_ai AS (SELECT id AS mp_id FROM meal_plan WHERE code='AI' LIMIT 1),
     mp_bb AS (SELECT id AS mp_id FROM meal_plan WHERE code='BB' LIMIT 1),
     mp_hb AS (SELECT id AS mp_id FROM meal_plan WHERE code='HB' LIMIT 1)
INSERT INTO tour_offer (
  tour_id, hotel_id, departure_city_id,
  start_date, nights, meal_plan_id,
  price, currency_code, includes_flight,
  is_available, available_seats, hotel_stars_cached
)
SELECT
  (SELECT t.id FROM tour t WHERE t.country_id = h.country_id ORDER BY t.id LIMIT 1) AS tour_id,
  h.id,
  v.departure_city_id,
  v.start_date::date,
  v.nights,
  v.meal_plan_id,
  v.price,
  v.currency_code::char(3),
  v.includes_flight,
  v.is_available,
  v.available_seats,
  h.stars
FROM hotel h
JOIN (VALUES
  ('Kemer Orion Resort',     (SELECT dc_id FROM dep_msk), '2026-05-10', 7,  (SELECT mp_id FROM mp_ai),  799, 'EUR', TRUE, TRUE, 12),
  ('Kemer Orion Resort',     (SELECT dc_id FROM dep_spb), '2026-05-17', 7,  (SELECT mp_id FROM mp_ai),  829, 'EUR', TRUE, TRUE, 10),

  ('Hurghada Coral Hotel',   (SELECT dc_id FROM dep_msk), '2026-01-25', 7,  (SELECT mp_id FROM mp_ai),  699, 'USD', TRUE, TRUE, 15),

  ('Dubai Marina View',      (SELECT dc_id FROM dep_msk), '2026-03-02', 5,  (SELECT mp_id FROM mp_bb),  999, 'EUR', TRUE, TRUE, 9),

  ('Phuket Ocean Breeze',    (SELECT dc_id FROM dep_kzn), '2026-02-12', 10, (SELECT mp_id FROM mp_bb),  1090,'EUR', TRUE, TRUE, 8),

  ('Nha Trang Bay Resort',   (SELECT dc_id FROM dep_spb), '2026-01-17', 12, (SELECT mp_id FROM mp_bb),  1290,'EUR', TRUE, TRUE, 8),

  ('Marbella Sun Hotel',     (SELECT dc_id FROM dep_msk), '2026-02-07', 7,  (SELECT mp_id FROM mp_hb),  980, 'EUR', TRUE, TRUE, 12),

  ('Rimini Adriatic Park',   (SELECT dc_id FROM dep_msk), '2026-06-06', 7,  (SELECT mp_id FROM mp_bb),  890, 'EUR', TRUE, TRUE, 14)
) v(hotel_name, departure_city_id, start_date, nights, meal_plan_id, price, currency_code, includes_flight, is_available, available_seats)
ON v.hotel_name = h.name
WHERE v.departure_city_id IS NOT NULL
ON CONFLICT ON CONSTRAINT uq_offer_key DO NOTHING;

INSERT INTO review (hotel_id, author_name, rating, text, source, created_at)
SELECT h.id, v.author_name, v.rating, v.text, v.source, now() - (v.days_ago || ' days')::interval
FROM hotel h
JOIN (VALUES
  ('Kemer Orion Resort','Анна', 4.7, 'Отличный сервис и питание, пляж рядом.', 'site', 12),
  ('Hurghada Coral Hotel','Олег', 4.0, 'Нормально за свои деньги, море тёплое.', 'site', 25),
  ('Dubai Marina View','Денис', 4.6, 'Очень комфортно, прекрасный вид.', 'site', 15),
  ('Phuket Ocean Breeze','Светлана', 4.3, 'Пляж близко, завтраки хорошие.', 'site', 20)
) v(hotel_name, author_name, rating, text, source, days_ago)
ON v.hotel_name = h.name
ON CONFLICT DO NOTHING;

INSERT INTO review_image (review_id, url)
SELECT r.id, v.url
FROM review r
JOIN hotel h ON h.id = r.hotel_id
JOIN (VALUES
  ('Kemer Orion Resort','https://picsum.photos/seed/rev_tr1/700/450'),
  ('Dubai Marina View','https://picsum.photos/seed/rev_ae1/700/450')
) v(hotel_name, url)
ON v.hotel_name = h.name
ON CONFLICT (review_id, url) DO NOTHING;

INSERT INTO contact_message (name, phone, email, message, status, created_at)
VALUES
  ('Алексей', '+7 900 000-00-01', 'alex@site.ru', 'Подберите тур в Турцию на 7 ночей.', 'new', now() - interval '1 day'),
  ('Наталья', '+7 900 000-00-02', NULL, 'Какие есть варианты в ОАЭ на март?', 'read', now() - interval '3 days'),
  ('Павел', '+7 900 000-00-03', 'pavel@site.ru', 'Нужна консультация по питанию AI.', 'closed', now() - interval '7 days')
ON CONFLICT DO NOTHING;