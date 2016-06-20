module C80Map
  class Building < ActiveRecord::Base
    has_many :areas, :class_name => 'C80Map::Area', :dependent => :destroy
    validates :coords, uniqueness: true
    after_save :update_json
    mount_uploader :img_bg, C80Map::BuildingImageUploader
    mount_uploader :img_overlay, C80Map::BuildingImageUploader

    private

    def update_json

      locations_path = Rails.root.join("public", "locations.json")
      locs = File.read(locations_path)
      puts "<update_json> #{ Rails.root.join("public", "locations.json") }"

      locs_hash = JSON.parse(locs)


      # и заполняем объектами из собранного массива

      # обходим все Building и составляем массив вида
      # [{id, object_type=object_type, coords, building_hash, img, childs:[<areas>]},..]
      buildings_to_location_json = []
      Building.all.each do |b|
        ob = {
            id: b.id,
            object_type: 'building',
            coords: b.coords.split(","),
            building_hash: {
                id: 2,
                title: "Здание 2",
                props: {
                    square: "1234 кв.м.",
                    square_free: "124 кв. м",
                    floor_height: "6 кв. м",
                    column_step: "2 м",
                    gate_type: "рaспашные",
                    communications: "Интернет, электричество, водоснабжение",
                    price: "от 155 руб/кв.м в месяц"
                }
            },
            img: {
                bg: {
                    src: b.img_bg.url
                },
                overlay: {
                    src: b.img_overlay.url
                }
            },
            childs: []
        }
        buildings_to_location_json << ob
      end

      # после чего удаляем из locs_hash все object_type=building
      # locs_hash["childs"].each do |child|
      #   if child["object_type"] == 'building'
      #     delete locs_hash["childs"]
      #   end
      # end

      # просто заменяем всех детей
      locs_hash["childs"] = buildings_to_location_json

      puts "<Building.update_json> #{locs_hash}"

      File.open(locations_path, 'w') do |f|
        f.write(locs_hash.to_json)
      end

    end

  end
end