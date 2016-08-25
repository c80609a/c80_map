class CreateC80MapBuildings < ActiveRecord::Migration
  def change
    create_table :c80_map_buildings, :options => 'COLLATE=utf8_unicode_ci' do |t|
      t.string :tag
      t.text :coords
      t.string :img_bg
      t.string :img_overlay
      t.timestamps
    end
  end
end