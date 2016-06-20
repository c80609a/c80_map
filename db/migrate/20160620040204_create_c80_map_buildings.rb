class CreateC80MapBuildings < ActiveRecord::Migration
  def change
    create_table :c80_map_buildings, :options => 'COLLATE=utf8_unicode_ci' do |t|
      t.string :coords
      t.timestamps
    end
  end
end