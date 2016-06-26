class CreateC80MapAreas < ActiveRecord::Migration
  def change
    create_table :c80_map_areas, :options => 'COLLATE=utf8_unicode_ci' do |t|
      t.text :coords
      t.references :building, index: true
      t.timestamps
    end
  end
end