module C80Map

  module AreaRepresentator

    extend ActiveSupport::Concern

    #  ERROR: Cannot define multiple 'included' blocks for a Concern
    # included do
    #
    # end

    def self.included(klass)
      klass.extend ClassMethods
      # klass.send(:include, InstanceMethods)
    end

    module ClassMethods

      def acts_as_map_area_representator
        class_eval do
          has_many :map_areas, :as => :area_representator, :class_name => 'C80Map::Area', :dependent => :destroy
        end
      end
    end

    # module InstanceMethods
    #
    #   def sites_list
    #   end
    # end

  end
end

ActiveRecord::Base.send :include, C80Map::AreaRepresentator