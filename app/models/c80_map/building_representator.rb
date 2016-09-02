module C80Map

  module BuildingRepresentator

    extend ActiveSupport::Concern

    #  ERROR: Cannot define multiple 'included' blocks for a Concern
    # included do
    #
    # end

    def self.included(klass)
      klass.extend ClassMethods
      klass.send(:include, InstanceMethods)
    end

    module ClassMethods

      def acts_as_map_building_representator
        class_eval do

          has_many :map_buildings, :as => :building_representator, :class_name => 'C80Map::Building', :dependent => :destroy
          after_save :update_json

          def self.unlinked_buildings
            res = []
            self.all.each do |building|
              # if building.map_buildings.count == 0
                res << building
              # end
            end
            res
          end

          def update_json
            MapJson.update_json
          end

        end
      end
    end

    module InstanceMethods

      def to_hash
        res = {
            id: id,
            title: title,
            props: {
                square: square,
                floor_height: floor_height,
                gate_type: gate_type,
                desc: desc,
                # column_step: column_step,
                # communications: communications,
                price: price_string
            }
        }
        res
      end

    end

  end
end

ActiveRecord::Base.send :include, C80Map::BuildingRepresentator