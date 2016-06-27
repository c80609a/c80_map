class CreateC80MapAreas < ActiveRecord::Migration
  def change
    create_table :c80_map_areas, :options => 'COLLATE=utf8_unicode_ci' do |t|
      t.text :tag
      t.text :coords
      t.references :building, index: true
      t.string :area_representator_type, :default => 'Rent::Area'
      t.references :area_representator, index: true
      t.timestamps
    end
  end
end