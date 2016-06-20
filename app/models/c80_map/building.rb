module C80Map
  class Building < ActiveRecord::Base
    has_many :areas, :class_name => 'C80Map::Area', :dependent => :destroy
    validates :coords, uniqueness: true
    after_save :update_json
    mount_uploader :img_bg, C80Map::BuildingImageUploader
    mount_uploader :img_overlay, C80Map::BuildingImageUploader

    private

    def update_json
      MapJson.update_json
    end

  end
end