ALTER TABLE planning_items
    ADD COLUMN venue_meal_price DECIMAL(15,0) NULL,
    ADD COLUMN venue_guarantee INT NULL,
    ADD COLUMN venue_rental_fee DECIMAL(15,0) NULL;
