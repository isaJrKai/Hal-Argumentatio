from datetime import date
import unittest
from forecast_contract import first_target_week
from batch_forecast import matches_trade_context


class FirstTargetWeekTests(unittest.TestCase):
    def test_stale_history_starts_at_current_utc_week(self):
        self.assertEqual(first_target_week(date(2026, 8, 3), date(2026, 11, 5)), date(2026, 11, 9))

    def test_recent_history_starts_the_following_week(self):
        self.assertEqual(first_target_week(date(2026, 10, 26), date(2026, 11, 5)), date(2026, 11, 9))

    def test_current_observed_week_starts_forecast_next_week(self):
        self.assertEqual(first_target_week(date(2026, 11, 2), date(2026, 11, 5)), date(2026, 11, 9))

    def test_trade_matching_uses_specific_niche_terms_not_generic_suffixes(self):
        self.assertTrue(matches_trade_context('Roofing Leads - Calgary', 'Roofing Contractor'))
        self.assertFalse(matches_trade_context('Plumbing Leads - Calgary', 'Roofing Contractor'))

    def test_non_monday_input_is_normalized_to_its_week(self):
        self.assertEqual(first_target_week(date(2026, 10, 28), date(2026, 11, 5)), date(2026, 11, 9))


if __name__ == "__main__":
    unittest.main()
