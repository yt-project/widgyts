"""Test widgyts and trait linking"""

import pytest
from unittest import TestCase
from yt.testing import fake_amr_ds
from numpy import array_equal

from widgyts import FRBViewer, DatasetViewer, AMRDomainViewer

from traitlets import HasTraits, TraitError

class TestFRBViewer(TestCase):

    def setUp(self):
        ds = fake_amr_ds()
        s = ds.r[:,:,0.5]
        self.data = s
        self.frb_dens = FRBViewer(height=512, width=512, px=s["px"], py=s["py"],
                             pdx=s["pdx"], pdy=s["pdy"], val=s["Density"])

    def test_frbviewer_traits(self):
        '''Checks that the FRBViewer widget has the expected traits '''
        trait_list = ['height', 'width', 'px', 'py', 'pdx', 'pdy', 'val']
        for trait in trait_list:
            assert self.frb_dens.has_trait(trait)

    def test_frb_arrays(self):
        '''Checks that the arrays passed into the FRBViewer match the original
        data'''
        px = self.data["px"]
        py = self.data["py"]
        pdx = self.data["pdx"]
        pdy = self.data["pdy"]
        val = self.data["Density"]

        assert array_equal(px, self.frb_dens.px)
        assert array_equal(py, self.frb_dens.py)
        assert array_equal(pdx, self.frb_dens.pdx)
        assert array_equal(pdy, self.frb_dens.pdy)
        assert array_equal(val, self.frb_dens.val)

class TestControls(TestCase):

    def setUp(self):
        ds = fake_amr_ds()
        s = ds.r[:,:,0.5]
        self.frb_dens = FRBViewer(height=512, width=512, px=s["px"], py=s["py"],
                             pdx=s["pdx"], pdy=s["pdy"], val=s["Density"])
        controls = self.frb_dens.setup_controls()
        self.navigation_controls = controls.children[0]
        self.colormap_controls = controls.children[1]

    def test_logscale(self):
        '''This test checks that the controls to the log scale of the colormap
        are passed from the controls to the colormap widget'''
        self.assertEqual(self.colormap_controls.children[0].value,
                self.frb_dens.colormaps.is_log)

        self.colormap_controls.children[0].value = False

        self.assertEqual(self.colormap_controls.children[0].value,
                self.frb_dens.colormaps.is_log)

    def test_mapchange(self):
        '''Test to check that changing the colormap name from the controls
        widget links to the colormap map_name trait'''
        self.assertEqual(self.colormap_controls.children[1].value,
                    self.frb_dens.colormaps.map_name)

        self.colormap_controls.children[1].value = 'doom'

        self.assertEqual(self.colormap_controls.children[1].value,
                    self.frb_dens.colormaps.map_name)

    def test_colorbar_min_change(self):
        '''Test to check that the min val control links to the colormap scale
        minimum value in the colormap widget'''
        # self.assertAlmostEqual(self.colormap_controls.children[2].value,
        #                   self.frb_dens.colormaps.min_val)

        self.colormap_controls.children[2].value = 1.52e-03

        self.assertAlmostEqual(self.colormap_controls.children[2].value,
                          self.frb_dens.colormaps.min_val)

    def test_colorbar_max_change(self):
        '''Test to check that the max val control links to the colormap scale
        minimum value in the colormap widget'''
        # self.assertAlmostEqual(self.colormap_controls.children[3].value,
        #                   self.frb_dens.colormaps.max_val)

        self.colormap_controls.children[3].value = 5.52e-03

        self.assertAlmostEqual(self.colormap_controls.children[3].value,
                          self.frb_dens.colormaps.max_val)

    def test_zoom_view(self):
        '''Test to check that the view width is changed as the zoom value
        slider changes'''
        zoom_control = self.navigation_controls.children[1]
        last_view = self.frb_dens.view_width
        # right now the zoom control doesn't immediately link to the width, so
        # we want to test that the linking happens after an update. They won't
        # match before.

        changing_views = [1.2, 2.0, 3.0, 4.0, 4.5]
        for view in changing_views:
            zoom_control.value = view
            self.assertNotEqual(self.frb_dens.view_width, last_view)
            last_view = self.frb_dens.view_width


class TestColormaps(TestCase):

    def setUp(self):
        ds = fake_amr_ds()
        s = ds.r[:,:,0.5]
        self.frb_dens = FRBViewer(height=512, width=512, px=s["px"], py=s["py"],
                             pdx=s["pdx"], pdy=s["pdy"], val=s["Density"])

    def test_colormap_traits(self):
        '''Checks that the Colormap widget has the expected traits '''
        trait_list = ['map_name', 'min_val', 'max_val', 'is_log']
        for trait in trait_list:
            assert self.frb_dens.colormaps.has_trait(trait)


class TestDatasetViewer(TestCase):

    def setUp(self):
        ds = fake_amr_ds()
        self.viewer = DatasetViewer(ds = ds)

    def test_component_traits(self):
        trait_list = ['ds', 'components']
        for trait in trait_list:
            assert self.viewer.has_trait(trait)

        # This should also have an AMR domain viewer

        assert len(self.viewer.components) == 3

    def test_amr_data_viewer(self):

        assert isinstance(self.viewer.components[0], AMRDomainViewer)
        adv = self.viewer.components[0]

        trait_list = ['domain_axes', 'grid_views', 'renderer',
                      'cmap_truncate']
        for trait in trait_list:
            assert adv.has_trait(trait)
