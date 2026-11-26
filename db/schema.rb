# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_26_035334) do
  create_table "employees", charset: "utf8mb4", collation: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "first_name", limit: 100, null: false
    t.string "last_name", limit: 100, null: false
    t.string "full_name", limit: 201, null: false
    t.string "email", null: false
    t.string "job_title", limit: 100, null: false
    t.string "department", limit: 100, null: false
    t.string "country", limit: 2, null: false
    t.decimal "salary", precision: 12, scale: 2, null: false
    t.string "employment_type", limit: 20, default: "full_time", null: false
    t.date "hire_date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "job_title", "salary"], name: "index_employees_on_country_and_job_title_and_salary"
    t.index ["department"], name: "index_employees_on_department"
    t.index ["email"], name: "index_employees_on_email", unique: true
    t.index ["full_name"], name: "index_employees_on_full_name"
    t.index ["job_title", "salary"], name: "index_employees_on_job_title_and_salary"
  end
end
