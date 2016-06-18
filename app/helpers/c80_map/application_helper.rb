module C80Map
  module ApplicationHelper

    def render_map(page_tag)
      if page_tag == 'index'


        # map_settings = C80Map::Setting.first


        # т.к. в json попадают строки вида
        # /home/scout/git/bitbucket/vorsa/public/uploads/map/map.jpg
        # извлечём эту строку, затем во вью обработаем её image_path

        p = Rails.root.join("public", "locations.json")
        locs = File.read(p)
        locs_hash = JSON.parse(locs)
        locs_hash["img"] = image_path(locs_hash["img"])

        render :partial => 'c80_map/map_row_index',
               :locals => {
                    locs_hash: locs_hash,
                    mapwidth:locs_hash["mapwidth"],
                    mapheight:locs_hash["mapheight"]
               }

      else
        render :partial => 'c80_map/map_row'
      end
    end

  end
end