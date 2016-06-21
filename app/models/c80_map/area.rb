module C80Map
  class Area < ActiveRecord::Base
    belongs_to :building
    validates :coords, uniqueness: true
    after_save :update_json

    protected

    def update_json
      MapJson.update_json
    end

  end
end