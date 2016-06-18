class CreateC80MapSettings < ActiveRecord::Migration
  def change
    create_table :c80_map_settings, :options => 'COLLATE=utf8_unicode_ci' do |t|
      t.string :map_image
      t.timestamps
    end
  end
end