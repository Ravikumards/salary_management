class CreateEmployees < ActiveRecord::Migration[8.1]
  def change
    create_table :employees do |t|
      t.string :first_name, null: false, limit: 100
      t.string :last_name, null: false, limit: 100
      t.string :full_name, null: false, limit: 201
      t.string :email, null: false
      t.string :job_title, null: false, limit: 100
      t.string :department, null: false, limit: 100
      t.string :country, null: false, limit: 2
      t.decimal :salary, null: false, precision: 12, scale: 2
      t.string :employment_type, null: false, default: "full_time", limit: 20
      t.date :hire_date, null: false

      t.timestamps
    end

    add_index :employees, :email, unique: true
    # Covers country-level and country+job-title insights (MIN/MAX/AVG) as an index-only scan.
    add_index :employees, %i[country job_title salary]
    add_index :employees, %i[job_title salary]
    add_index :employees, :department
    add_index :employees, :full_name
  end
end
